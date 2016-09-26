#node django rest framework
Query your django rest framework api easily, many tools to join your node app with a django rest framework api fast and simple.

##HOW TO USE
###ndrf(protocol:String, domain:String, opts:Object[Optional])
``` js
var ndrf = require('ndrf')
var protocol = 'http'
var domain = 'ndrf.test'

var api = ndrf.api(protocol, domain, {
	'tokenSlug': '/api-token-auth', //Default '/api-token-auth'
	'apiSlug': '/api', //Default '/api'
	'PORT': 80 //Default 80
})
```

###Request object
Contains CRUD(get, post, put, patch, delete) methods and, whether you don't choose otherwise, the body will returned json parsed. 

On request object, the requests will make using 'apiSlug' option , in other words, under '/api' slug by default. Then whether we send a request to '/proof', you are actually sending a request to '/api/proof'.
Whether you don't want to use this feature, set 'apiSlug' to '/' or any slug under live your api.

####GET Request (slug:String, callback:Function, json:Boolean[Default: true])
``` js
var request = api.request
var statusCodeExpected = 200

request
	.get('/foo/url', (err, res, jsonBody) => {
		if (err || res.statusCode !== statusCodeExpected) throw new Error('Something went wrong.')
		
		//Do something with body parsed in json.
	})
```

####POST, PATCH, PUT, DELETE Requests (slug:String, data:Object, callback:Function, json:Boolean(Default: true))
``` js
var userData = {username: 'foo', password: 'fooito5632'}

request
	.post('/user/login', userData, (err, res, jsonBody) => {
		if (err || res.statusCode !== statusCodeExpected) throw new Error('Something went wrong.')
		
		//Do something with body parsed in json.
	})
```

###DJANGO REST FRAMEWORK SPECIFIC FEATURES
####Token User Authentication
Send request to '/api-token-auth' slug by default, you can chage 'tokenSlug' option to any custom slug.
``` js
var ndrf = require('ndrf')
var protocol = 'http'
var domain = 'ndrf.test'

var api = ndrf.api(protocol, domain)

var userData = {username: 'foo', password: 'fooito5632'}

api.auth.user(userData, (err, res, jsonBody) => {
	if (err || res.statusCode !== statusCodeExpected) throw new Error('Something went wrong.')
	
	//Do something with body parsed in json.
})
```

###EXPRESS MIDDLEWARE
``` js
var ndrfMiddleware = require('ndrf').apiMiddleware

app.use(ndrfMiddleware)

//or

app.use((req, res, next) => {
	ndrfMiddleware(req, res, next, {
		host: 'ndrf.com', //By default use 'host' or 'origin' header.	
	})
})
```
