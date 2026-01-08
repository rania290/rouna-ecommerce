import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react'
import { aiService } from '../../services/aiService'
import { motion, AnimatePresence } from 'framer-motion'

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(() => {
    // Récupérer l'historique du chat depuis le stockage local s'il existe
    const savedChat = localStorage.getItem('chatHistory')
    if (savedChat) {
      try {
        return JSON.parse(savedChat)
      } catch (e) {
        console.error('Erreur lors de la récupération de l\'historique du chat', e)
      }
    }
    // Message de bienvenue initial
    return [
      {
        role: 'bot',
        content: 'Bonjour ! Je suis votre assistant IA Rouna. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString()
      },
    ]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Sauvegarder l'historique des messages dans le stockage local
    localStorage.setItem('chatHistory', JSON.stringify(messages))
    
    // Faire défiler vers le dernier message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Effet pour charger l'historique au montage
  useEffect(() => {
    // Vérifier si c'est la première visite de l'utilisateur aujourd'hui
    const lastVisit = localStorage.getItem('lastChatVisit')
    const today = new Date().toDateString()
    
    if (!lastVisit || new Date(lastVisit).toDateString() !== today) {
      // Réinitialiser la conversation pour une nouvelle journée
      setMessages([
        {
          role: 'bot',
          content: `Bonjour ! Je suis votre assistant IA Rouna. Comment puis-je vous aider aujourd'hui, le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} ?`,
          timestamp: new Date().toISOString()
        },
      ])
      localStorage.setItem('lastChatVisit', new Date().toISOString())
    }
  }, [])

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || loading) return

    // Créer le message utilisateur
    const userMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString()
    }

    // Ajouter le message de l'utilisateur immédiatement
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Appeler le service IA avec le contexte de la conversation
      const response = await aiService.chatWithAI(trimmedInput, {
        previousMessages: messages.slice(-4) // Envoyer les 4 derniers messages comme contexte
      })
      
      // Créer la réponse du bot
      const botMessage = {
        role: 'bot',
        content: response.message,
        suggestions: response.suggestions || [],
        timestamp: new Date().toISOString()
      }

      // Mettre à jour les messages avec la réponse du bot
      setMessages(prev => [...prev, botMessage])
      
      // Envoyer un événement de suivi
      if (window.gtag) {
        window.gtag('event', 'chat_message_sent', {
          'event_category': 'engagement',
          'event_label': 'Chat Interaction'
        })
      }
    } catch (error) {
      console.error('Erreur lors de la communication avec le chatbot:', error)
      
      const errorMessage = {
        role: 'bot',
        content: 'Je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
        timestamp: new Date().toISOString(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion)
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-secondary-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistant IA Rouna</h3>
                  <p className="text-xs text-white/80">En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[85%] ${
                      message.role === 'user' ? 'ml-auto' : ''
                    }`}
                  >
                    {message.role === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        } ${message.isError ? 'border-l-4 border-red-500' : ''}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Horodatage */}
                      <div className={`text-xs px-2 text-gray-500 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary-100 rounded-lg px-4 py-2">
                    <Loader className="w-4 h-4 animate-spin text-secondary-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
                aria-label="Votre message"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Envoyer le message"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            
            <div className="mt-2 text-xs text-center text-gray-500">
              Rouna IA peut faire des erreurs. Vérifiez les informations importantes.
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIChatBot

