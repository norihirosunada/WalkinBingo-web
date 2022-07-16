require 'bundler/setup'
Bundler.require
require 'sinatra/reloader' if development?

get '/' do
    @title = "タイトル"
    erb :index
end

post '/label' do
    # uri = URI(https://vision.googleapis.com/v1/images:annotate)
end