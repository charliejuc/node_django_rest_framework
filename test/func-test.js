var util = require('util')
var test = require('tape')
var Nock = require('nock')
var protocol = 'http'
var domain = 'customvote.test'
var endpoint = util.format('%s://%s', protocol, domain)
var nock = Nock(endpoint)

var ndrf = require('../')

var successApiResponseAsserts = (t, statusCode, method, checkBody) => (err, res, body) => {
	console.log(util.format("--- %s REQUEST ---", method))
	t.error(err, 'Should not be an error.')
	t.equals(res.statusCode, statusCode, util.format('Status code should be equals to %s.', statusCode))
	
	if (checkBody || true) t.ok(body, 'Should be body')
}

var failApiResponseAsserts = (t, statusCode, method) => (err, res, body) => {
	t.ok(err, 'Should be an error.')
	t.equals(res.statusCode, statusCode, util.format('Status code should be equals to %s.', statusCode))
	t.ok(body, 'Should not be body')
}

var authUserAsserts = (t, tokenObj, end) => (err, res, obj) => {
	end = end || true

	successApiResponseAsserts(t, 200, 'POST')

	t.ok(obj['token'], 'Should have a token.')
	t.equals(tokenObj['token'], obj['token'], 'Got token should be equal to sent token.')

	if (end) t.end()
}

test('Should be create api object properly', function (t) {
	var api = ndrf.api(protocol, domain)

	t.ok(api, 'Api should be')
	t.equals(api.constructor, {}.constructor, 'req.djrfApi should be a json object')

	t.ok(api.apiManager, 'api.apiManager should be')
	t.equals(api.apiManager.constructor, {}.constructor, 'api.apiManager should be a json object')

	t.ok(api.options, 'api.options should be')
	t.equals(api.options.constructor, {}.constructor, 'api.options should be a json object')

	t.ok(api.apiSlug, 'api.apiSlug should be')

	t.ok(api.auth, 'api.auth should be')
	t.equals(api.auth.constructor, {}.constructor, 'api.auth should be a json object')

	t.ok(api.auth.sessionAuth === false || api.auth.sessionAuth === true, 'api.sessionAuth should be equal to boolean')

	t.ok(api.auth.tokenAuth === false || api.auth.tokenAuth === true, 'api.tokenAuth should be equal to boolean')

	t.ok(api.auth.user, 'api.auth.user should be')
	t.equals(typeof api.auth.user, 'function', 'api.auth.user should be a function')

	t.ok(api.auth.tokenUser, 'api.auth.tokenUser should be')
	t.equals(typeof api.auth.tokenUser, 'function', 'api.auth.tokenUser should be a function')

	t.ok(api.auth.sessionUser, 'api.auth.sessionUser should be')
	t.equals(typeof api.auth.sessionUser, 'function', 'api.auth.sessionUser should be a function')

	t.ok(api.getFullApiSlug, 'api.getFullApiSlug should be')
	t.equals(typeof api.getFullApiSlug, 'function', 'api.getFullApiSlug should be a function')

	t.ok(api.request, 'api.request should be')
	t.equals(api.request.constructor, {}.constructor, 'api.request should be a json object')

	t.ok(api.request.get, 'api.request.get should be')
	t.equals(typeof api.request.get, 'function', 'api.request.get should be a function')

	t.ok(api.request.post, 'api.request.post should be')
	t.equals(typeof api.request.post, 'function', 'api.request.post should be a function')

	t.ok(api.request.delete, 'api.request.delete should be')
	t.equals(typeof api.request.delete, 'function', 'api.request.delete should be a function')

	t.ok(api.request.put, 'api.request.put should be')
	t.equals(typeof api.request.put, 'function', 'api.request.put should be a function')

	t.ok(api.request.patch, 'api.request.patch should be')
	t.equals(typeof api.request.patch, 'function', 'api.request.patch should be a function')

	t.end()
})

test('Should be work properly CRUD', function (t) {
	var obj = { 'success': true }
	var slug = '/proof'
	var nockSlug = util.format('/api%s', slug)

	nock
		.get(nockSlug)
		.reply(200, obj)

	nock
		.post(nockSlug)
		.reply(201)

	nock
		.put(nockSlug)
		.reply(200, obj)

	nock
		.patch(nockSlug)
		.reply(204)

	nock
		.delete(nockSlug)
		.reply(204)

	var api = ndrf.api(protocol, domain)
	var req = api.request

	req
		.get(slug, successApiResponseAsserts(t, 200, 'GET'))
	req
		.post(slug, { create: 'this thing' }, successApiResponseAsserts(t, 201, 'POST', false))
	req
		.put(slug, { put: 'this thing' }, successApiResponseAsserts(t, 200, 'PUT'))
	req
		.patch(slug, { patch: 'this thing' }, successApiResponseAsserts(t, 204, 'PATCH', false))
	req
		.delete(slug, { delete: 'this thing' }, successApiResponseAsserts(t, 204, 'DELETE', false))
})

test('Should be get authentication token', function (t) {
	var tokenObj = { 'token': 'sdfsdafas232sddasfs' }

	nock
		.post('/api-token-auth/')
		.reply(200, tokenObj)

	var api = ndrf.api(protocol, domain)

	api.auth.user({ username: 'foo', password: 'foo1242A' }, authUserAsserts(t, tokenObj))
})

test('Should be create middleware', function (t) {
	var tokenObj = { 'token': 'sdfsdafas232sddasfs' }

	nock
		.post('/api-token-auth/')
		.reply(200, tokenObj)

	var api = ndrf.api(protocol, domain)

	var req = {}
	var res = {}
	var next = () => {
		t.ok(req.djrfApi, 'Should be djrfApi')
		t.ok(req.djrfApi, 'req.djrfApi should be')
		t.equals(req.djrfApi.constructor, {}.constructor, 'req.djrfApi should a json object')

		req.djrfApi.auth.user({ username: '41231a', password: 'testing5power' }, authUserAsserts(t, tokenObj))
	}

	var options = {
		host: domain
	}

	var apiMiddleware = ndrf.apiMiddleware(req, res, next, options)
})