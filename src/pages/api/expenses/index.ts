import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import { generateId } from '@/lib/ulid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createApiHandler } from '@/lib/apiHandler';

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { user_guid, status } = req.query;
    const userGuid = typeof user_guid === 'string' ? user_guid : undefined;

    let expenses;

    if (status === 'none') {
      // 未精算: マッチングに紐づいていない支出
      let query = `
        SELECT
          e.guid, u.guid AS user_guid, e.name, e.price, e.note,
          e.paid_at, e.created_at, e.updated_at
        FROM expenses e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN expense_matching_expenses eme ON eme.expense_id = e.id
        WHERE eme.id IS NULL
      `;
      const params: string[] = [];
      if (userGuid) {
        query += ' AND u.guid = ?';
        params.push(userGuid);
      }
      query += ' ORDER BY e.paid_at DESC';
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      expenses = rows.map((row) => ({ ...row, linked_matchings: [] }));

    } else if (status === 'unsettled' || status === 'settled') {
      // 精算中 / 精算済: 2クエリで取得
      const idsQuery =
        status === 'unsettled'
          ? `SELECT DISTINCT eme.expense_id
             FROM expense_matching_expenses eme
             INNER JOIN expense_matchings m ON eme.expense_matching_id = m.id
             WHERE eme.expense_id IS NOT NULL AND m.settled_at IS NULL`
          : `SELECT eme.expense_id
             FROM expense_matching_expenses eme
             INNER JOIN expense_matchings m ON eme.expense_matching_id = m.id
             WHERE eme.expense_id IS NOT NULL
             GROUP BY eme.expense_id
             HAVING COUNT(*) = COUNT(m.settled_at)`;

      const [idRows] = await pool.query<RowDataPacket[]>(idsQuery);
      const expenseIds = idRows.map((row) => row.expense_id);

      if (expenseIds.length === 0) {
        return res.status(200).json({ expenses: [] });
      }

      let query = `
        SELECT
          e.guid, u.guid AS user_guid, e.name, e.price, e.note,
          e.paid_at, e.created_at, e.updated_at,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('guid', m.guid, 'name', m.name))
            FROM expense_matching_expenses eme
            INNER JOIN expense_matchings m ON eme.expense_matching_id = m.id
            WHERE eme.expense_id = e.id
          ) AS linked_matchings
        FROM expenses e
        INNER JOIN users u ON e.user_id = u.id
        WHERE e.id IN (?)
      `;
      const params: (string | number[])[] = [expenseIds];
      if (userGuid) {
        query += ' AND u.guid = ?';
        params.push(userGuid);
      }
      query += ' ORDER BY e.paid_at DESC';
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      expenses = rows.map((row) => ({ ...row, linked_matchings: row.linked_matchings || [] }));

    } else {
      // デフォルト: 全件取得（既存動作）
      let query = `
        SELECT
          e.guid, u.guid AS user_guid, e.name, e.price, e.note,
          e.paid_at, e.created_at, e.updated_at,
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('guid', m.guid, 'name', m.name))
            FROM expense_matching_expenses eme
            INNER JOIN expense_matchings m ON eme.expense_matching_id = m.id
            WHERE eme.expense_id = e.id
          ) AS linked_matchings
        FROM expenses e
        INNER JOIN users u ON e.user_id = u.id
      `;
      const params: string[] = [];
      if (userGuid) {
        query += ' WHERE u.guid = ?';
        params.push(userGuid);
      }
      query += ' ORDER BY e.paid_at DESC';
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      expenses = rows.map((row) => ({ ...row, linked_matchings: row.linked_matchings || [] }));
    }

    return res.status(200).json({ expenses });
  } catch (error) {
    console.error('経費一覧取得エラー:', error);
    return res.status(500).json({ error: '経費の取得に失敗しました' });
  }
};

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { user_guid, name, price, note, paid_at } = req.body;

    if (!user_guid || !name || price === undefined || !paid_at) {
      return res.status(400).json({
        error: '必須項目が不足しています（user_guid, name, price, paid_at）',
      });
    }

    // Get user_id from user_guid
    const [userRows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE guid = ?', [
      user_guid,
    ]);

    if (userRows.length === 0) {
      return res.status(400).json({ error: 'ユーザーが見つかりません' });
    }

    const userId = userRows[0].id;
    const guid = generateId();

    const query = `
      INSERT INTO expenses (guid, user_id, name, price, note, paid_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.query<ResultSetHeader>(query, [guid, userId, name, price, note || null, paid_at]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.guid, u.guid AS user_guid, e.name, e.price, e.note, e.paid_at, e.created_at, e.updated_at
       FROM expenses e
       INNER JOIN users u ON e.user_id = u.id
       WHERE e.guid = ?`,
      [guid]
    );

    return res.status(201).json({ expense: rows[0] });
  } catch (error) {
    console.error('経費作成エラー:', error);
    return res.status(500).json({ error: '経費の作成に失敗しました' });
  }
};

export default createApiHandler({ GET: handleGet, POST: handlePost });
