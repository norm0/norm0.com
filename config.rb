# General config
# http://localhost:4567/__middleman
require 'fileutils'
ENV['TMPDIR'] ||= File.join(root, '.tmp')
FileUtils.mkdir_p(ENV['TMPDIR'])

activate :inline_svg

# Import custom libraries and helpers
Dir['./*/*.rb'].each { |file| load file }
include FaviconsHelper

# Load Sass from node_modules
config[:sass_assets_paths] << File.join(root, 'node_modules')

set :css_dir,    'assets/stylesheets'
set :fonts_dir,  'assets/fonts'
set :images_dir, 'assets/images'
set :js_dir,     'assets/javascripts'
set :tmp_dir,    File.join(root, '.tmp')

# Performance optimizations
set :haml, format: :html5
set :sass, style: :compressed
set :file_watcher_ignore, [
  %r{^\.git/},
  %r{^\.bundle/},
  %r{^\.sass-cache/},
  %r{^build/},
  %r{^node_modules/}
]

# Set favicons
set :favicons, [
  {
    rel: 'apple-touch-icon',
    size: '180x180',
    icon: 'apple-touch-icon.png'
  },
  {
    rel: 'icon',
    type: 'image/png',
    size: '32x32',
    icon: 'favicon32x32.png'
  },
  {
    rel: 'icon',
    type: 'image/png',
    size: '16x16',
    icon: 'favicon16x16.png'
  },
  {
    rel: 'shortcut icon',
    size: '64x64,32x32,24x24,16x16',
    icon: 'favicon.ico'
  }
]

# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions
activate :external_pipeline,
         name: :vite,
         command: build? ? 'yarn run build' : 'yarn run start',
         source: 'dist',
         latency: 1

activate :dotenv
activate :meta_tags
activate :directory_indexes

# Layouts
# https://middlemanapp.com/basics/layouts

page '/*.xml',  layout: false
page '/*.json', layout: false
page '/*.txt',  layout: false

# With alternative layout
# page '/path/to/file.html', layout: 'other_layout'

# Proxy pages
# https://middlemanapp.com/advanced/dynamic-pages

# proxy(
#   '/this-page-has-no-template.html',
#   '/template-file.html',
#   locals: {
#     which_fake_page: 'Rendering a fake page with a local variable'
#   }
# )

# Helpers
# Methods defined in the helpers block are available in templates
# https://middlemanapp.com/basics/helper-methods

# helpers do
#   def some_helper
#     'Helping'
#   end
# end

# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

configure :development do
  set      :debug_assets, true
activate :livereload, port: 35730
end

configure :build do
  ignore   File.join(config[:js_dir], '*') # handled by Vite pipeline
  set      :asset_host, @app.data.site.host
  set      :relative_links, true

  # Optimize assets
  activate :asset_hash, ignore: [%r{^images/}, %r{^fonts/}, /\.svg$/]
  activate :gzip
  activate :minify_css
  activate :minify_html, remove_comments: true
  # activate :minify_javascript
  activate :relative_assets

  # Ignore unnecessary files during build
  ignore 'assets/stylesheets/components/.gitkeep'
  ignore 'assets/stylesheets/vendor/.gitkeep'
  ignore 'assets/fonts/.keep'
  ignore '*.DS_Store'
  ignore '*.map'

end

# activate :deploy do |deploy|
#   deploy.deploy_method = :git
#   deploy.branch        = 'gh-pages'
#   deploy.build_before  = true
# end
