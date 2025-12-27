import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { generateId } from '@/lib/ulid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const MATCHING_SELECT = `
  SELECT m.guid, m.name, u.guid AS created_user_guid, m.settled_at, m.created_at, m.updated_at
  FROM expense_matchings m
  INNER JOIN users u ON m.created_user_id = u.id
`;

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const query = `${MATCHING_SELECT} ORDER BY m.created_at DESC`;
    const [rows] = await pool.query<RowDataPacket[]>(query);

    return res.status(200).json({ matchings: rows });
  } catch (error) {
    console.error('マッチング一覧取得エラー:', error);
    return res.status(500).json({ error: 'マッチングの取得に失敗しました' });
  }
};

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { name, created_user_guid } = req.body;

    if (!name || !created_user_guid) {
      return res.status(400).json({
        error: '必須項目が不足しています（name, created_user_guid）',
      });
    }

    // Get user_id from user_guid
    const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE guid = ?', [
      created_user_guid,
    ]);

    if (userRows.length === 0) {
      return res.status(400).json({ error: 'ユーザーが見つかりません' });
    }

    const userId = userRows[0].id;
    const guid = generateId();

    const query = `
      INSERT INTO expense_matchings (guid, name, created_user_id)
      VALUES (?, ?, ?)
    `;

    await pool.query<ResultSetHeader>(query, [guid, name, userId]);

    const [rows] = await pool.query<RowDataPacket[]>(`${MATCHING_SELECT} WHERE m.guid = ?`, [guid]);

    return res.status(201).json({ matching: { ...rows[0], expenses: [] } });
  } catch (error) {
    console.error('マッチング作成エラー:', error);
    return res.status(500).json({ error: 'マッチングの作成に失敗しました' });
  }
};

export default createApiHandler({ GET: handleGet, POST: handlePost });
