const request = require('supertest');
const app = require('./app');

describe('DevSecOps Demo App - API Tests', () => {

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /login', () => {
    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/login')
        .send({ username: 'invalid', password: 'invalid' })
        .expect(401);
    });
  });

  describe('POST /merge-config', () => {
    it('should merge config objects', async () => {
      const res = await request(app)
        .post('/merge-config')
        .send({ theme: 'dark', lang: 'en' })
        .expect(200);
      expect(res.body.config).toHaveProperty('theme', 'dark');
    });
  });

});
