require 'mycroft'

class MockBroadcaster < Mycroft::Client

  attr_accessor :verified

  def initialize(host, port)
    @key = '/path/to/key'
    @cert = '/path/to/cert'
    @manifest = './app.json'
    @verified = false
    super
  end

  def connect
    while(true) do
      msg = $stdin.gets.chomp
      broadcast(msg)
    end
    # Your code here
  end

  def on_data(data)
    # Your code here
  end

  def on_end
    # Your code here
  end
end

Mycroft.start(MockBroadcaster)