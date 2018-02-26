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
		try {
			return JSON.parse(body)

		} catch(e) {
			return body

		}
	}

	self.jsonResponse = function (err, res, body, callback) {
		var bodyParsed = self.jsonParse(body)

		callback(undefined, res, bodyParsed)
	}

	self.getFullUrl = function (slug) {
		return self.url + slug
	}

	self.request = {
		get: function (slug, callback, options) {
			self.request.base('get', slug, callback, undefined, options)
		},
		post: function (slug, data, callback, options) {
			self.request.base('post', slug, callback, data, options)
		},
		put: function (slug, data, callback, options) {
			self.request.base('put', slug, callback, data, options)
		},
		patch: function (slug, data, callback, options) {
			self.request.base('patch', slug, callback, data, options)
		},
		delete: function (slug, data, callback, options) {
			self.request.base('delete', slug, callback, data, options)
		},
		base: function (method, slug, callback, data, options) {
			options = options || {} 

			options.url = self.getFullUrl(slug)
			options.json = options.json != undefined ? options.json : true

			if ( data )
				options.body = data

			request[method](options, function (err, res, body) {
			  if (err || ! options.json || ! body) return callback(err, res, body)

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
	self.tokenSlug = self.options.tokenSlug || "/api-token-auth/"
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

	self.auth.tokenUser = function (user_data, callback, options) {
		self.apiManager.request.post(self.tokenSlug, user_data, callback, options)
	}

	self.auth.sessionUser = function (user_data, callback) {
		throw new Error("\"sessionUser\" function is not implemented yet. You can type this function and create git pull request. REMEMBER TO ADD TESTS.")
	}


	self.getFullApiSlug = function (slug) {
		var fullApiSlug = self.apiSlug + slug

		return fullApiSlug.replace(/\/+/g, '/')
	}

	self.request = {
		get: function (apiSlug, callback, options) {
			self.request.base('get', apiSlug, callback, undefined, options)
		},
		post: function (apiSlug, data, callback, options) {
			self.request.base('post', apiSlug, callback, data, options)
		},
		put: function (apiSlug, data, callback, options) {
			self.request.base('put', apiSlug, callback, data, options)
		},
		patch: function (apiSlug, data, callback, options) {
			self.request.base('patch', apiSlug, callback, data, options)
		},
		delete: function (apiSlug, data, callback, options) {
			self.request.base('delete', apiSlug, callback, data, options)
		},
		base: function (method, apiSlug, callback, data, options) {
			var fullApiSlug = self.getFullApiSlug(apiSlug)

			self.apiManager.request.base(method, fullApiSlug, callback, data, options)
		}
	}

	self.tokenRequest = function (userToken) {
		if ( ! userToken ) throw new Error('User Token is required.')

		var tokenRequest = {
			userToken: userToken,
			get: function (slug, callback, options) {
				tokenRequest.base('get', slug, callback, undefined, options)
			},
			post: function (slug, data, callback, options) {
				tokenRequest.base('post', slug, callback, data, options)
			},
			put: function (slug, data, callback, options) {
				tokenRequest.base('put', slug, callback, data, options)
			},
			patch: function (slug, data, callback, options) {
				tokenRequest.base('patch', slug, callback, data, options)
			},
			delete: function (slug, data, callback, options) {
				tokenRequest.base('delete', slug, callback, data, options)
			},
			base: function (method, slug, callback, data, options) {
				options = options || {}
				options.headers = options.headers || {}
				options.headers['Authorization'] = `Token ${tokenRequest.userToken}`
				
				self.request.base(method, slug, callback, data, options)
			}
		}

		return tokenRequest
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