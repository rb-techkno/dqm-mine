import express from 'express';
import pool from '../db/db.js';
import { dbService } from '../services/dbService.js';

const router = express.Router();

// (optional placeholder)
export const getBusinessRules = async () => {
  const dbId = getDbId();
  const res = await pool.query(`SELECT * FROM rules WHERE db_id = $1`,[dbId]);
  console.log('Fetched business rules for DB:', dbId, res.rows);
  return res.rows;
};

// Helper to get current database identifier
const getDbId = () => {
  if (!dbService.activeConnection) return 'no-connection';
  return `${dbService.activeConnection.dbType}:${dbService.activeConnection.database || 'default'}`;
};

// 🔥 Mapper: DB → camelCase
const mapRule = (row) => ({
  id: row.id,
  ruleName: row.rule_name,
  scope: row.rule_scope,
  tableName: row.table_name,
  columnName: row.column_name,
  ruleDefinition: row.rule_definition,
  severity: row.severity,
  createdAt: row.created_at
});


// ✅ GET rules (with pagination + filtering)
router.get('/', async (req, res) => {
  try {
    const dbId = getDbId();

    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const { severity, rule_scope } = req.query;

    let query = `
      SELECT 
        id,
        rule_name,
        rule_scope,
        table_name,
        column_name,
        rule_definition,
        severity,
        created_at
      FROM rules
      WHERE db_id = $1
    `;

    const values = [dbId];
    let index = 2;

    if (severity) {
      query += ` AND severity = $${index++}`;
      values.push(severity);
    }

    if (rule_scope) {
      query += ` AND rule_scope = $${index++}`;
      values.push(rule_scope);
    }

    query += ` ORDER BY created_at DESC LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM rules WHERE db_id = $1`,
      [dbId]
    );

    res.json({
      data: result.rows.map(mapRule),
      pagination: {
        page,
        limit,
        total: parseInt(countRes.rows[0].count)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ✅ CREATE rule
router.post('/', async (req, res) => {
  try {
    const dbId = getDbId();

    const {
      ruleName,
      scope,
      tableName,
      columnName,
      ruleDefinition,
      severity
    } = req.body;

    const scopeMap = {
      Specific: "COLUMN",
      Global: "GLOBAL"
    };

    const rule_scope = scopeMap[scope] || "COLUMN";

    if (!ruleName || !rule_scope || !ruleDefinition) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO rules 
      (rule_name, rule_scope, table_name, column_name, rule_definition, severity, db_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        ruleName,
        rule_scope,
        tableName,
        columnName,
        ruleDefinition,
        severity,
        dbId
      ]
    );

    res.status(201).json(mapRule(result.rows[0]));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ✅ UPDATE rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbId = getDbId();

    const {
      ruleName,
      scope,
      tableName,
      columnName,
      ruleDefinition,
      severity
    } = req.body;

    const scopeMap = {
      Specific: "COLUMN",
      Global: "GLOBAL"
    };

    const rule_scope = scopeMap[scope];

    const result = await pool.query(
      `UPDATE rules SET
        rule_name = $1,
        rule_scope = $2,
        table_name = $3,
        column_name = $4,
        rule_definition = $5,
        severity = $6
      WHERE id = $7 AND db_id = $8
      RETURNING *`,
      [
        ruleName,
        rule_scope,
        tableName,
        columnName,
        ruleDefinition,
        severity,
        id,
        dbId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.json(mapRule(result.rows[0]));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ✅ DELETE rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbId = getDbId();

    const result = await pool.query(
      `DELETE FROM rules WHERE id = $1 AND db_id = $2`,
      [id, dbId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    res.status(204).send();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;