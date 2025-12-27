import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const query = 'SELECT guid, name, created_at, updated_at FROM users ORDER BY id ASC';
    const [rows] = await pool.query<RowDataPacket[]>(query);

    return res.status(200).json({ users: rows });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return res.status(500).json({ error: 'ユーザーの取得に失敗しました' });
  }
};

export default createApiHandler({ GET: handleGet });
