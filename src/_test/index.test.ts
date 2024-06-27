import chai from 'chai';
import chaiHttp from 'chai-http';
import { expect } from 'chai';
import app from '../index';

chai.use(chaiHttp);

describe('Server Tests', () => {
    it('should start the server and respond to a basic request', (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('should have the correct CORS headers', (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
                expect(res).to.have.header('access-control-allow-origin', process.env.CORS_ORIGIN);
                done();
            });
    });

    // Add more test cases as needed
});
