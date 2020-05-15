require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')

app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

axios.defaults.headers.common['Authorization'] = `SSWS `+process.env.TOKEN

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.ISSUER,
  clientId: process.env.CLIENT_ID,
  });

app.use(function(req,res,next){
    var authz = req.header("Authorization")
    if(authz.startsWith("Bearer")){
      oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token,process.env.TOKEN_AUD)
      .then(jwt => {
          req.userContext = jwt.claims.sub
          return next();
      })
      .catch(err => {
        res.status(401).send({message: 'Access denied.'})
      });   
    }
    else{
      if(process.env.AUTHZ_KEY == null){
        console.log("You must set AUTHZ_KEY to a value in your environment.")
        res.status(401).send({message: 'Access denied, authorization has not been configured.'})
      }
      else if(process.env.AUTHZ_KEY != authz){
        console.log("Unauthenticated request.")
        res.status(401).send({message: 'Access denied.'})
      } else {
        next()
      }
    }
  })

var agentRouter = require('./routes/agent')()
var entityRouter = require('./routes/entity')()
var hooksRouter = require('./routes/hooks')()
app.use('/entity', entityRouter)
app.use('/agent', agentRouter)
app.use('/tokenEnrichment', hooksRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('app started on '+PORT))