var async = require('async')
var util = require('util')
var test = require('tape')
var Nock = require('nock')
var protocol = 'http'
var domain = 'customvote.test'
var endpoint = util.format('%s://%s', protocol, domain)

var ndrf = require('../')

var successApiResponseAsserts = (t, statusCode, method, checkBody) => (err, res, body) => {
	console.log(util.format("--- %s REQUEST ---", method))

	if ( checkBody != true && checkBody != false ) checkBody = true

	t.error(err, 'Should not be an error.')
	t.equals(res && res.statusCode || 404, statusCode, util.format('Status code should be equals to %s.', statusCode))
	
	if (checkBody) t.ok(body, 'Should be body')
}

var failApiResponseAsserts = (t, statusCode, method) => (err, res, body) => {
	t.ok(err, 'Should be an error.')
	t.equals(res.statusCode, statusCode, util.format('Status code should be equals to %s.', statusCode))
	t.ok(body, 'Should not be body')
}

var authUserAsserts = (t, tokenObj, end) => (err, res, obj) => {
	end = end || true

	successApiResponseAsserts(t, 200, 'POST')(err, res, obj)

	t.ok(obj, 'Should be.')
	t.ok(obj && obj['token'], 'Should have a token.')
	t.equals(tokenObj['token'], obj && obj['token'], 'Got token should be equal to sent token.')

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

	t.ok(api.tokenRequest, 'Should be.')
	t.equals(typeof api.tokenRequest, 'function', 'Should be a function.')

	var token = 'sdfasdf23343'
	var tokenRequest = api.tokenRequest(token)

	t.ok(tokenRequest.userToken, 'tokenRequest.userToken should be')
	t.equals(tokenRequest.userToken, token, 'tokenRequest.userToken should be a function')

	t.ok(tokenRequest.get, 'tokenRequest.get should be')
	t.equals(typeof tokenRequest.get, 'function', 'tokenRequest.get should be a function')

	t.ok(tokenRequest.post, 'tokenRequest.post should be')
	t.equals(typeof tokenRequest.post, 'function', 'tokenRequest.post should be a function')

	t.ok(tokenRequest.delete, 'tokenRequest.delete should be')
	t.equals(typeof tokenRequest.delete, 'function', 'tokenRequest.delete should be a function')

	t.ok(tokenRequest.put, 'tokenRequest.put should be')
	t.equals(typeof tokenRequest.put, 'function', 'tokenRequest.put should be a function')

	t.ok(tokenRequest.patch, 'tokenRequest.patch should be')
	t.equals(typeof tokenRequest.patch, 'function', 'tokenRequest.patch should be a function')

	t.end()
})

test('Should be work properly CRUD', function (t) {
	var obj = { 'success': true }
	var slug = '/proof'
	var fullSlug = util.format('/api%s', slug)

	var nock = Nock(endpoint)

	nock
		.get(fullSlug)
		.reply(200, obj)

	nock
		.post(fullSlug)
		.reply(201)

	nock
		.put(fullSlug)
		.reply(200, obj)

	nock
		.patch(fullSlug)
		.reply(204)

	nock
		.delete(fullSlug)
		.reply(204)

	var api = ndrf.api(protocol, domain)
	var req = api.request
	var baseReq = api.apiManager.request

	function getReq (cb) { 
		req
			.get(slug, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'GET')(err, res, body)
				cb()
			})
	}

	function postReq (cb) { 
		req
			.post(slug, { create: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 201, 'POST', false)(err, res, body)
				cb()
			})
	}

	function putReq (cb) { 
		req
			.put(slug, { put: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'PUT')(err, res, body)
				cb()
			})
	}

	function patchReq (cb) { 
		req
			.patch(slug, { patch: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'PATCH', false)(err, res, body)
				cb()
			})
	}

	function deleteReq (cb) { 
		req
			.delete(slug, { delete: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'DELETE', false)(err, res, body)
				cb()
			})
	}

	function getReqBase (cb) { 
		baseReq
			.get(fullSlug, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'GET')(err, res, body)
				cb()
			})
	}

	function postReqBase (cb) { 
		baseReq
			.post(fullSlug, { create: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 201, 'POST', false)(err, res, body)
				cb()
			})
	}

	function putReqBase (cb) { 
		baseReq
			.put(fullSlug, { put: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'PUT')(err, res, body)
				cb()
			})
	}

	function patchReqBase (cb) { 
		baseReq
			.patch(fullSlug, { patch: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'PATCH', false)(err, res, body)
				cb()
			})
	}

	function deleteReqBase (cb) { 
		baseReq
			.delete(fullSlug, { delete: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'DELETE', false)(err, res, body)
				cb()
			})
	}

	async.series([
		getReq,
		postReq,
		putReq,
		patchReq,
		deleteReq
	], (err) => {
		t.error(err, 'Should not be a final error.')

		baseCrud()
	})

	function baseCrud () {
		var nock = Nock(endpoint)

		nock
			.get(fullSlug)
			.reply(200, obj)

		nock
			.post(fullSlug)
			.reply(201)

		nock
			.put(fullSlug)
			.reply(200, obj)

		nock
			.patch(fullSlug)
			.reply(204)

		nock
			.delete(fullSlug)
			.reply(204)


		async.series([
			getReqBase,
			postReqBase,
			putReqBase,
			patchReqBase,
			deleteReqBase
		], (err) => {
			t.error(err, 'Should not be a final error.')

			t.end()
		})
	}
})

test('Should be get authentication token', function (t) {
	var tokenObj = { 'token': 'sdfsdafas232sddasfs' }
	var nock = Nock(endpoint)

	nock
		.post('/api-token-auth/')
		.reply(200, tokenObj)

	var api = ndrf.api(protocol, domain)

	api.auth.user({ username: 'foo', password: 'foo1242A' }, authUserAsserts(t, tokenObj))
})

test('Should be create middleware', function (t) {
	var tokenObj = { 'token': 'sdfsdafas232sddasfs' }
	var nock = Nock(endpoint)

	nock
		.post('/api-token-auth/')
		.reply(200, tokenObj)

	var api = ndrf.api(protocol, domain)

	var req = {}
	var res = {}
	var next = () => {
		t.ok(req.djrfApi, 'Should be djrfApi.')
		t.ok(req.djrfApi, 'req.djrfApi should be.')
		t.equals(req.djrfApi.constructor, {}.constructor, 'req.djrfApi should a json object.')

		req.djrfApi.auth.user({ username: '41231a', password: 'testing5power' }, authUserAsserts(t, tokenObj))
	}

	var options = {
		host: domain
	}

	var apiMiddleware = ndrf.apiMiddleware(req, res, next, options)
})

test('Should be fail POST request', function (t) {
	var tokenObj = { 'token': 'sdfsdafas232sddasfs' }

	var api = ndrf.api(protocol, domain)

	api.auth.user({ username: 'foo', password: 'foo1242A' }, (err) => {
		t.ok(err, 'Should be an error.')

		t.end()
	})
})

test('Should throw exception', function (t) { 
	var api = ndrf.api(protocol, domain)

	try {
		api.tokenRequest()
	} catch (e) {
		t.ok(e, 'Should be an error when domain is undefined.')
	}

	try {
		api = ndrf.api(undefined, domain)
	} catch (e) {
		t.ok(e, 'Should be an error when protocol is undefined.')
	}

	try {
		api = ndrf.api(protocol, undefined)
	} catch (e) {
		t.ok(e, 'Should be an error when domain is undefined.')
	}

	t.end()
})

test('Should be make token requests', function (t) { 
	var api = ndrf.api(protocol, domain)
	var token = 'dfasdf223SDFASadf2'
	var req = api.tokenRequest(token)
	var slug = '/proof'
	var fullSlug = util.format('/api%s', slug)

	var nock = Nock(endpoint)

	var obj = { success: true }

	nock
		.get(fullSlug)
		.reply(200, obj)

	nock
		.post(fullSlug)
		.reply(201)

	nock
		.put(fullSlug)
		.reply(200, obj)

	nock
		.patch(fullSlug)
		.reply(204)

	nock
		.delete(fullSlug)
		.reply(204)

	function getReq (cb) { 
		req
			.get(slug, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'GET')(err, res, body)
				cb()
			})
	}

	function postReq (cb) { 
		req
			.post(slug, { create: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 201, 'POST', false)(err, res, body)
				cb()
			})
	}

	function putReq (cb) { 
		req
			.put(slug, { put: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 200, 'PUT')(err, res, body)
				cb()
			})
	}

	function patchReq (cb) { 
		req
			.patch(slug, { patch: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'PATCH', false)(err, res, body)
				cb()
			})
	}

	function deleteReq (cb) { 
		req
			.delete(slug, { delete: 'this thing' }, (err, res, body) => { 
				successApiResponseAsserts(t, 204, 'DELETE', false)(err, res, body)
				cb()
			})
	}

	async.series([
		getReq,
		postReq,
		putReq,
		patchReq,
		deleteReq
	], (err) => {
		t.error(err, 'Should not be a final error.')

		t.end()
	})
	
})
