require 'bundler/setup'
Bundler.require
require 'sinatra/reloader' if development?

get '/' do
    @title = "タイトル"
    
    erb :index
end
