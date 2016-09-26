var util = require('util')
var request = require('request')

function apiManager (protocol, domain, options) {
	var self = {}
	self.protocol = protocol
	self.domain = domain

	if ( ! protocol ) throw new Error("protocol is a required parameter")
	if ( ! domain ) throw new Error("domain is a required parameter")

	self.options = options || {}
	self.PORT = self.options.PORT || 80
	
	self.url = util.format('%s://%s:%s', self.protocol, self.domain, self.PORT)

	self.jsonParse = function (body) {
		return JSON.parse(body)
	}

	self.jsonResponse = function (err, res, body, callback) {
		var bodyParsed = self.jsonParse(body)

		callback(undefined, res, bodyParsed)
	}

	self.getFullUrl = function (slug) {
		return self.url + slug
	}

	self.request = {
		get: function (slug, callback, json) {
			self.request.base('get', slug, callback, undefined, json)
		},
		post: function (slug, data, callback, json) {
			self.request.base('post', slug, callback, data, json)
		},
		put: function (slug, data, callback, json) {
			self.request.base('put', slug, callback, data, json)
		},
		patch: function (slug, data, callback, json) {
			self.request.base('patch', slug, callback, data, json)
		},
		delete: function (slug, data, callback, json) {
			self.request.base('delete', slug, callback, data, json)
		},
		base: function (method, slug, callback, data, json) {
			json = json || true
			var url = self.getFullUrl(slug)

			request[method]({ url: url, form: data }, function (err, res, body) {
			  if (err || ! json || ! body) return callback(err, res, body)

			  self.jsonResponse(err, res, body, callback)
			})
		}
	}

	return self
}

function djangoRestFrameworkManager (protocol, domain, options) {

	var self = {}

	self.apiManager = apiManager(protocol, domain, options)
	self.options = self.apiManager.options

	//slugs
	self.tokenSlug = self.options.tokenSlug || "/api-token-auth"
	self.apiSlug = self.options.apiSlug || "/api"

	//auth config
	self.auth = {}
	self.auth.sessionAuth = self.options.sessionAuth || false
	self.auth.tokenAuth = self.options.tokenAuth || ! self.options.sessionAuth

	if (self.auth.sessionAuth == self.auth.tokenAuth) throw new Error("You need set one auth mode: sessionAuth or tokenAuth")

	self.auth.user = function (user_data, callback) {
		if (self.auth.tokenAuth) {
			return self.auth.tokenUser(user_data, callback)
		} 
		else if (self.auth.sessionAuth) {
			return self.auth.sessionUser(user_data, callback)
		}
	}

	self.auth.tokenUser = function (user_data, callback) {
		self.apiManager.request.post(self.tokenSlug, user_data, callback)
	}

	self.auth.sessionUser = function (user_data, callback) {
		throw new Error("\"sessionUser\" function is not implemented yet. You can type this function and create git pull request. REMEMBER TO ADD TESTS.")
	}


	self.getFullApiSlug = function (slug) {
		var fullApiSlug = self.apiSlug + slug

		return fullApiSlug.replace(/\/+/g, '/')
	}

	self.request = {
		get: function (apiSlug, callback, json) {
			self.request.base('get', apiSlug, callback, undefined, json)
		},
		post: function (apiSlug, data, callback, json) {
			self.request.base('post', apiSlug, callback, data, json)
		},
		put: function (apiSlug, data, callback, json) {
			self.request.base('put', apiSlug, callback, data, json)
		},
		patch: function (apiSlug, data, callback, json) {
			self.request.base('patch', apiSlug, callback, data, json)
		},
		delete: function (apiSlug, data, callback, json) {
			self.request.base('delete', apiSlug, callback, data, json)
		},
		base: function (method, apiSlug, callback, data, json) {
			var fullApiSlug = self.getFullApiSlug(apiSlug)

			self.apiManager.request.base(method, fullApiSlug, callback, data, json)
		}
	}

	return self
}

function djangoRestFrameworkApiMiddleware(req, res, next, options) {
	options = options || {}
	var protocol = req.secure && 'https' || 'http'
	var domain = options.host || req.get('host') || req.get('origin')

	req.djrfApi = djangoRestFrameworkManager(protocol, domain, options)

	next()
}

module.exports = {
	'api': djangoRestFrameworkManager,
	'apiMiddleware': djangoRestFrameworkApiMiddleware
}