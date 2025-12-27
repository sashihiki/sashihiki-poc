import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const MATCHING_SELECT = `
  SELECT m.guid, m.name, u.guid AS created_user_guid, m.settled_at, m.created_at, m.updated_at
  FROM expense_matchings m
  INNER JOIN users u ON m.created_user_id = u.id
`;

// スナップショットデータを使用（元の支出が削除されても表示可能）
const MATCHING_EXPENSE_SELECT = `
  SELECT
    eme.id AS matching_expense_id,
    eme.expense_id,
    eme.user_guid,
    eme.expense_name AS name,
    eme.expense_price AS price,
    eme.expense_paid_at AS paid_at,
    eme.request_amount
  FROM expense_matching_expenses eme
`;

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    // Get matching with internal id for expense lookup
    const [matchingRows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.guid, m.name, u.guid AS created_user_guid, m.settled_at, m.created_at, m.updated_at
       FROM expense_matchings m
       INNER JOIN users u ON m.created_user_id = u.id
       WHERE m.guid = ?`,
      [id]
    );

    if (matchingRows.length === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    const matchingRow = matchingRows[0];
    const matchingInternalId = matchingRow.id;

    // Get associated expenses (snapshot data)
    const [expenseRows] = await pool.query<RowDataPacket[]>(
      `${MATCHING_EXPENSE_SELECT}
       WHERE eme.expense_matching_id = ?
       ORDER BY eme.expense_paid_at DESC`,
      [matchingInternalId]
    );

    // Get existing expense ids to determine which are deleted
    const expenseIds = expenseRows
      .map((row) => row.expense_id)
      .filter((id): id is number => id !== null);

    let existingExpenseIds = new Set<number>();
    if (expenseIds.length > 0) {
      const [existingRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, guid FROM expenses WHERE id IN (?)`,
        [expenseIds]
      );
      existingExpenseIds = new Set(existingRows.map((row) => row.id));
      // Create a map of id to guid
      const idToGuid = new Map(existingRows.map((row) => [row.id, row.guid]));
      // Attach guid to expense rows
      expenseRows.forEach((row) => {
        row.expense_guid = row.expense_id ? idToGuid.get(row.expense_id) || null : null;
      });
    }

    // Remove internal id from response
    const { id: _id, ...matching } = matchingRow;

    // Build expenses with is_deleted flag
    const expenses = expenseRows.map((row) => {
      const { expense_id: _expenseId, ...rest } = row;
      return {
        ...rest,
        is_deleted: row.expense_id === null || !existingExpenseIds.has(row.expense_id),
      };
    });

    return res.status(200).json({
      matching: {
        ...matching,
        expenses,
      },
    });
  } catch (error) {
    console.error('マッチング取得エラー:', error);
    return res.status(500).json({ error: 'マッチングの取得に失敗しました' });
  }
};

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { name, created_user_guid, settled_at } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (created_user_guid !== undefined) {
      // Get user_id from user_guid
      const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE guid = ?', [
        created_user_guid,
      ]);
      if (userRows.length === 0) {
        return res.status(400).json({ error: 'ユーザーが見つかりません' });
      }
      updates.push('created_user_id = ?');
      params.push(userRows[0].id);
    }
    if (settled_at !== undefined) {
      updates.push('settled_at = ?');
      params.push(settled_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '更新する項目が指定されていません' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE expense_matchings SET ${updates.join(', ')} WHERE guid = ?`;

    const [result] = await pool.query<ResultSetHeader>(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`${MATCHING_SELECT} WHERE m.guid = ?`, [id]);

    return res.status(200).json({ matching: rows[0] });
  } catch (error) {
    console.error('マッチング更新エラー:', error);
    return res.status(500).json({ error: 'マッチングの更新に失敗しました' });
  }
};

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    // Get matching to find its database ID
    const [matchingRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM expense_matchings WHERE guid = ?',
      [id]
    );

    if (matchingRows.length === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    const matchingId = matchingRows[0].id;

    // Delete associated expenses first
    await pool.query('DELETE FROM expense_matching_expenses WHERE expense_matching_id = ?', [
      matchingId,
    ]);

    // Delete the matching
    await pool.query('DELETE FROM expense_matchings WHERE guid = ?', [id]);

    return res.status(200).json({ message: 'マッチングを削除しました' });
  } catch (error) {
    console.error('マッチング削除エラー:', error);
    return res.status(500).json({ error: 'マッチングの削除に失敗しました' });
  }
};

export default createApiHandler({ GET: handleGet, PUT: handlePut, DELETE: handleDelete });
