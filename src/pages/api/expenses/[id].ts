import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const EXPENSE_SELECT = `
  SELECT
    e.guid,
    u.guid AS user_guid,
    e.name,
    e.price,
    e.note,
    e.paid_at,
    e.created_at,
    e.updated_at,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('guid', m.guid, 'name', m.name))
      FROM expense_matching_expenses eme
      INNER JOIN expense_matchings m ON eme.expense_matching_id = m.id
      WHERE eme.expense_id = e.id
    ) AS linked_matchings
  FROM expenses e
  INNER JOIN users u ON e.user_id = u.id
`;

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`${EXPENSE_SELECT} WHERE e.guid = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '経費が見つかりません' });
    }

    const expense = {
      ...rows[0],
      linked_matchings: rows[0].linked_matchings || [],
    };

    return res.status(200).json({ expense });
  } catch (error) {
    console.error('経費取得エラー:', error);
    return res.status(500).json({ error: '経費の取得に失敗しました' });
  }
};

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const { user_guid, name, price, note, paid_at } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (user_guid !== undefined) {
      // Get user_id from user_guid
      const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE guid = ?', [
        user_guid,
      ]);
      if (userRows.length === 0) {
        return res.status(400).json({ error: 'ユーザーが見つかりません' });
      }
      updates.push('user_id = ?');
      params.push(userRows[0].id);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      params.push(note);
    }
    if (paid_at !== undefined) {
      updates.push('paid_at = ?');
      params.push(paid_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '更新する項目が指定されていません' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE expenses SET ${updates.join(', ')} WHERE guid = ?`;

    const [result] = await pool.query<ResultSetHeader>(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '経費が見つかりません' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`${EXPENSE_SELECT} WHERE e.guid = ?`, [id]);

    return res.status(200).json({ expense: rows[0] });
  } catch (error) {
    console.error('経費更新エラー:', error);
    return res.status(500).json({ error: '経費の更新に失敗しました' });
  }
};

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    // Delete expense (ON DELETE SET NULL will set expense_id to NULL in expense_matching_expenses)
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM expenses WHERE guid = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '経費が見つかりません' });
    }

    return res.status(200).json({ message: '経費を削除しました' });
  } catch (error) {
    console.error('経費削除エラー:', error);
    return res.status(500).json({ error: '経費の削除に失敗しました' });
  }
};

export default createApiHandler({ GET: handleGet, PUT: handlePut, DELETE: handleDelete });
