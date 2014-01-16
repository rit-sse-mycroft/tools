require 'mycroft'

class MockBroadcast < Mycroft::Client

  attr_accessor :verified

  def initialize(q)
    @key = ''
    @cert = ''
    @manifest = './app.json'
    @verified = false

    @queue = q

    cb = Proc.new do |msg|

      content = {text: msg}
      broadcast(content)

      q.pop &cb
    end

    q.pop &cb
  end

  def connect
    # Your code here
  end

  def on_data(data)
    parsed = parse_message(data)
    if parsed[:type] == 'APP_MANIFEST_OK' || parsed[:type] == 'APP_MANIFEST_FAIL'
      check_manifest(parsed)
      @verified = true
    end
  end

  def on_end
    # Your code here
  end
end

class KeyboardHandler < EM::Connection
  include EM::Protocols::LineText2

  attr_reader :queue

  def initialize(q)
    @queue = q
  end

  def receive_line(data)
    @queue.push(data)
  end
end

EventMachine.run do
  q = EventMachine::Queue.new

  EventMachine.connect('localhost', 1847, MockBroadcast, q)
  EventMachine.open_keyboard(KeyboardHandler, q)
end
