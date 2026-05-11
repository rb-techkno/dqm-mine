
import express from 'express';
import { dbService } from '../services/dbService.js';
const router = express.Router();

// Mock data for business rules
export let businessRules = [];

// Helper to get current database identifier
const getDbId = () => {
  if (!dbService.activeConnection) return 'no-connection';
  return `${dbService.activeConnection.dbType}:${dbService.activeConnection.database || 'default'}`;
};

// GET all business rules for the current database
router.get('/', (req, res) => {
  const currentDbId = getDbId();
  // Filter rules by current database
  const filteredRules = businessRules.filter(r => r.dbId === currentDbId);
  res.json(filteredRules);
});

// POST a new business rule
router.post('/', (req, res) => {
  const currentDbId = getDbId();
  const newRule = { ...req.body, id: Date.now(), dbId: currentDbId };
  businessRules.push(newRule);
  res.status(201).json(newRule);
});

// PUT (update) a business rule
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const index = businessRules.findIndex(r => r.id === parseInt(id));
  if (index !== -1) {
    const currentDbId = businessRules[index].dbId; // Keep existing dbId
    businessRules[index] = { ...req.body, id: parseInt(id), dbId: currentDbId };
    res.json(businessRules[index]);
  } else {
    res.status(404).json({ message: 'Rule not found' });
  }
});

// DELETE a business rule
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = businessRules.length;
  businessRules = businessRules.filter(r => r.id !== parseInt(id));
  if (businessRules.length < initialLength) {
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Rule not found' });
  }
});

export default router;
