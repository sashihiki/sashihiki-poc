import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const MATCHING_SELECT = `
  SELECT m.guid, m.name, u.guid AS created_user_guid, m.settled_at, m.created_at, m.updated_at
  FROM expense_matchings m
  INNER JOIN users u ON m.created_user_id = u.id
`;

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'IDが指定されていません' });
    }

    // Check if matching exists
    const [matchingRows] = await pool.query<RowDataPacket[]>(
      'SELECT settled_at FROM expense_matchings WHERE guid = ?',
      [id]
    );

    if (matchingRows.length === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    if (matchingRows[0].settled_at) {
      return res.status(400).json({ error: 'このマッチングは既に精算済みです' });
    }

    // Set settled_at to current timestamp
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE expense_matchings SET settled_at = NOW(), updated_at = NOW() WHERE guid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'マッチングが見つかりません' });
    }

    // Get updated matching
    const [updatedRows] = await pool.query<RowDataPacket[]>(`${MATCHING_SELECT} WHERE m.guid = ?`, [
      id,
    ]);

    return res.status(200).json({
      message: 'マッチングを精算しました',
      matching: updatedRows[0],
    });
  } catch (error) {
    console.error('マッチング精算エラー:', error);
    return res.status(500).json({ error: 'マッチングの精算に失敗しました' });
  }
};

export default createApiHandler({ POST: handlePost });
