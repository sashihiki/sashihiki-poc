import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { expense_guid, request_amount } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'マッチングIDが指定されていません' });
    }

    if (!expense_guid) {
      return res.status(400).json({ error: '経費GUIDが指定されていません' });
    }

    // Get matching ID
    const [matchingRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM expense_matchings WHERE guid = ?',
      [id]
    );

    if (matchingRows.length === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    const matchingId = matchingRows[0].id;

    // Get expense with user_guid for snapshot
    const [expenseRows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, u.guid AS user_guid, e.name, e.price, e.paid_at
       FROM expenses e
       INNER JOIN users u ON e.user_id = u.id
       WHERE e.guid = ?`,
      [expense_guid]
    );

    if (expenseRows.length === 0) {
      return res.status(404).json({ error: '経費が見つかりません' });
    }

    const expense = expenseRows[0];

    // Check if already exists
    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM expense_matching_expenses WHERE expense_matching_id = ? AND expense_id = ?',
      [matchingId, expense.id]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'この経費は既にマッチングに追加されています' });
    }

    // Add expense to matching with snapshot
    const query = `
      INSERT INTO expense_matching_expenses
        (expense_matching_id, expense_id, user_guid, expense_name, expense_price, expense_paid_at, request_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query<ResultSetHeader>(query, [
      matchingId,
      expense.id,
      expense.user_guid,
      expense.name,
      expense.price,
      expense.paid_at,
      request_amount || null,
    ]);

    return res.status(201).json({ message: '経費をマッチングに追加しました' });
  } catch (error) {
    console.error('マッチング経費追加エラー:', error);
    return res.status(500).json({ error: 'マッチングへの経費追加に失敗しました' });
  }
};

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { expense_guid } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'マッチングIDが指定されていません' });
    }

    if (!expense_guid) {
      return res.status(400).json({ error: '経費GUIDが指定されていません' });
    }

    // Get matching ID
    const [matchingRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM expense_matchings WHERE guid = ?',
      [id]
    );

    if (matchingRows.length === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    const matchingId = matchingRows[0].id;

    // Get expense ID from guid
    const [expenseRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM expenses WHERE guid = ?',
      [expense_guid]
    );

    if (expenseRows.length === 0) {
      return res.status(404).json({ error: '経費が見つかりません' });
    }

    const expenseId = expenseRows[0].id;

    // Remove expense from matching
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM expense_matching_expenses WHERE expense_matching_id = ? AND expense_id = ?',
      [matchingId, expenseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'この経費はマッチングに含まれていません' });
    }

    return res.status(200).json({ message: '経費をマッチングから削除しました' });
  } catch (error) {
    console.error('マッチング経費削除エラー:', error);
    return res.status(500).json({ error: 'マッチングからの経費削除に失敗しました' });
  }
};

export default createApiHandler({ POST: handlePost, DELETE: handleDelete });
