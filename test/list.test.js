'use strict';

/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('List Capabilities', () => {
  let database;
  let client;
  before(done => {
    environment.config({ path: './test/.env' });
    varium({ manifestPath });
    connect('nedb://memory')
      .then(db => {
        database = db;
        return database.dropDatabase();
      })
      .then(() => {
        return done();
      });
  });

  before(done => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    client.save().then(client => done());
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done());
  });

  it('should allow you to list records', () => {
    return expect(client.list(process.env.LAYOUT))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .list(process.env.LAYOUT, {
          request: { timeout: 10 }
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should allow you use parameters to modify the list response', () => {
    return expect(client.list(process.env.LAYOUT, { _limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should should allow you to use numbers in parameters', () => {
    return expect(client.list(process.env.LAYOUT, { _limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should should allow you to provide an array of portals in parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        _limit: 2,
        portals: [{ name: 'planets', limit: 1, offset: 1 }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.be.a('array')
      .and.property(0)
      .to.have.all.keys(
        'fieldData',
        'modId',
        'portalData',
        'recordId',
        'portalDataInfo'
      )
      .and.property('portalData')
      .to.be.a('object');
  });

  it('should should remove non used properties from a portal object', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        _limit: 2,
        portals: [{ name: 'planets', limit: 1, offset: 1, han: 'solo' }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.be.a('array')
      .and.property(0)
      .to.have.all.keys(
        'fieldData',
        'modId',
        'portalData',
        'recordId',
        'portalDataInfo'
      )
      .and.property('portalData')
      .to.be.a('object');
  });

  it('should modify requests to comply with DAPI name reservations', () => {
    return expect(client.list(process.env.LAYOUT, { limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow strings while complying with DAPI name reservations', () => {
    return expect(client.list(process.env.LAYOUT, { limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow you to offset the list response', () => {
    return expect(client.list(process.env.LAYOUT, { limit: 2, offset: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should santize parameters that would cause unexpected parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, { error: 'fail', limit: 2, offset: 2 })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo');
  });

  it('should allow you to limit the number of portal records to return', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        portal: ['planets'],
        'limit.planets': 2,
        limit: 2
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should accept namespaced portal limit and offset parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        portal: ['planets'],
        '_limit.planets': 2,
        limit: 2
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should reject invalid parameters', () => {
    return expect(
      client
        .list(process.env.LAYOUT, { error: 'fail', limit: -2, offset: 2 })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
