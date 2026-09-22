const crypto = require('crypto');

class BaseRepository {
  constructor(Model) {
    this.Model = Model;
    this.items = new Map();
  }

  create(data) {
    const id = crypto.randomUUID();
    const entity = new this.Model({ ...data, id });
    this.items.set(id, entity);
    return entity;
  }

  findAll() {
    return Array.from(this.items.values());
  }

  findById(id) {
    return this.items.get(id) || null;
  }

  update(id, data) {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = new this.Model({ ...existing, ...data, id });
    this.items.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.items.delete(id);
  }

  clear() {
    this.items.clear();
  }
}

module.exports = BaseRepository;
