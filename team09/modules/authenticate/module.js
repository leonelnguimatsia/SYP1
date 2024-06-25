const fs = require('fs')
const path = require('path')
const express = require('express')

const logger = process.logger('authenticate')

/**
 * This module provides basic access control for pages offered by the express application.
 * 
 * By default every resource contained within public directories is always accessible, 
 * but every other request (even if the requested resource does not exist) is blocked unless the client is authenticated.
 * Pages which should always be accessible (like a login page) can be whitelisted by adding a corresponding
 * entry into the whitelist array contained within the exported object.
 */

/**
 * @typedef {Object} AuthenticateOptions
 * @property {(string | RegExp)[]} AuthenticateOptions.whitelist Which urls or url-patterns should always be accessible.
 * @property {express.RequestHandler} AuthenticateOptions.onAuthenticationFailure The request handler executed if authentication fails.
 * @property {string} AuthenticateOptions.onFailureRedirectTarget If the default onAuthenticationFailure listener is used: 
 *                                                                Where the client should be redirected to if not authenticated.
 */
/** @type {AuthenticateOptions} */
let options = {
    whitelist: [],
    onAuthenticationFailure: null,
    onFailureRedirectTarget: '/'
}

/** @type {string[]} */
let public = []

function testWhitelist(value, url) {
    if (value instanceof RegExp)
        return value.test(url)
    else if (typeof value === 'string')
        return value === url
    return false
}

/** @type {express.RequestHandler} */
function onAuthenticationFailure(req, res, next) {
    logger.verbose(`Access violation at ${url(req)}, redirecting to: ${options.onFailureRedirectTarget}`)
    res.redirect(options.onFailureRedirectTarget)
}

function url(req) {
    return req.correctUrl
}

/** @type {express.RequestHandler} */
function auth(req, res, next) {
    // allow access if either the user is authenticated or the file is public or the file is whitelisted
    const u = url(req)
    if (req.session?.auth || public.some(v => v == u) || options.whitelist.some(v => testWhitelist(v, u))) {
        logger.debug(`Validated request for url '${u}'`)
        next()
    } else
        (options.onAuthenticationFailure || onAuthenticationFailure)(req, res, next)
}


/**
 * Recursive function which collects all files within a directory, 
 * while also resolving their relative path on the server.
 * @param {string} abspath the absolute path to the directory or subdirectory thereof
 * @param {string} relpath the relative path on the server
 * @returns {string[]} the collected files as relative paths
 */
 function collectFiles(abspath, relpath) {
    let collected = []
    fs.readdirSync(abspath, { withFileTypes: true }).forEach(v => {
        // resolve paths for file
        const fileAbsPath = path.join(abspath, v.name)
        const fileRelPath = path.join(relpath, v.name)
        // if directory: Call collectFiles again on this directory, add results to return array
        if (v.isDirectory())
            collected.push(...collectFiles(fileAbsPath, fileRelPath))
        // if file is a file add to array
        else if (v.isFile())
            collected.push('/' + fileRelPath)
    })
    return collected
}

function staticOverwrite(app, oldStatic) {
    logger.verbose(`Overwriting express.static`)
    return (root, options) => {
        // add all public files to a specific array
        const files = collectFiles(root, '.')
        public.push(...files)
        logger.debug(`Public expanded, new entries: [${files.join(', ')}]`)
        // pass-through to old static function 
        return oldStatic.call(app, root, options)
    }
}

/** @type {import("../moduleFunction").ModuleFunction} */
module.exports = app => {
    // overwrite app.static so that all public files can be recorded
    app.static = staticOverwrite(app, app.static)
    // apply authentication middleware
    logger.info('Installing authentication middleware')
    app.use(auth)

    const _wlPush = options.whitelist.push
    options.whitelist.push = (...items) => {
        if (items?.length)
            logger.debug(`Whitelist expanded, new entries: [${items.join(', ')}]`)
        _wlPush.call(options.whitelist, ...items)
    }

    return { options }
}
