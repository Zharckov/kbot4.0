module.exports = {
    apps: [{
        name: "KBot4.0",
        script: `${__dirname}/bin/server.js`,
        watch: ["server"],
        watch_delat: 1000,
        ignore_watch: ["node_modules", /\.json$/gim],
        env: {
            NODE_ENV: "development"
        },
        env_producton: {
            NODE_ENV: "production"
        }
    }]
}