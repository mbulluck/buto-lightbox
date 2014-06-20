module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: ['src/lib/jquery.colorbox.js', 'src/lib/spin.min.js', 'src/<%= pkg.name %>.js'],
                dest: 'js/<%= pkg.name %>.js'
            }
        },
        jsonlint: {
            pkg: {
                src: [ "package.json" ]
            }
        },
        watch: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            tasks: "default"
        },
        uglify: {
            all: {
                files: {
                    'js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                },
                options: {
                    mangle: false,
                    preserveComments: false,
                    banner: '/*! <%= pkg.name %> | buto.tv */\n',
                    compress: {
                        hoist_funs: false,
                        loops: false,
                        unused: false,
                        drop_console: true
                    }
                }
            }
        }
    });

    // Load grunt tasks from NPM packages
    require("load-grunt-tasks")(grunt);

    // Default grunt
    grunt.registerTask('default', [ 'jsonlint', 'concat', 'uglify']);

};