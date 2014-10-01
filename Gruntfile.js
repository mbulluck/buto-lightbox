module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/lib/jquery.colorbox.js','src/lib/spin.js','src/<%= pkg.name %>.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        jsonlint: {
            pkg: {
                src: [ "package.json" ]
            }
        },
        jshint: {
            src: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    console: true,
                    module: true,
                    document: true,
                    require: true,
                    define: true
                },
                ignores: ['src/lib/*.js'],
                funcscope:true,
                evil: true // allow eval which we use for clickablem
            }
        },
        watch: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            tasks: "dev",
            options: {
                atBegin: true
            }
        },
        uglify: {
            all: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
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

    // Just run tests
    grunt.registerTask('test', [ 'jshint']);

    // Used for watch task
    grunt.registerTask('dev', [ 'jsonlint', 'test', 'concat']);

    // Default grunt
    grunt.registerTask('default', [ 'jsonlint', 'test', 'concat', 'uglify']);

};