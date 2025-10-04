import React, { useState, useEffect, useRef, useCallback } from 'react';
    import { useLocation } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Send, Phone, Video, MoreVertical, ArrowLeft, Search, Loader2, Paperclip, X, Edit, Trash2, Check, Smile } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { v4 as uuidv4 } from 'uuid';
    import {
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuTrigger,
    } from "@/components/ui/context-menu";
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog";

    const ChatPage = () => {
      const { user } = useAuth();
      const location = useLocation();
      const [conversations, setConversations] = useState([]);
      const [selectedConversation, setSelectedConversation] = useState(null);
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState('');
      const [imageFile, setImageFile] = useState(null);
      const [imagePreview, setImagePreview] = useState(null);
      const [loading, setLoading] = useState(true);
      const [loadingMessages, setLoadingMessages] = useState(false);
      const [sendingMessage, setSendingMessage] = useState(false);
      const [editingMessage, setEditingMessage] = useState(null);
      const [editingContent, setEditingContent] = useState('');
      const [deletingMessage, setDeletingMessage] = useState(null);
      const messagesEndRef = useRef(null);
      const fileInputRef = useRef(null);
      const editInputRef = useRef(null);

      const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const { data: convosData, error: convosError } = await supabase
            .from('conversations')
            .select('id, participant_ids, messages ( content, created_at, image_url )')
            .contains('participant_ids', [user.id])
            .order('created_at', { foreignTable: 'messages', ascending: false })
            .limit(1, { foreignTable: 'messages' });

          if (convosError) throw convosError;

          const participantIds = [...new Set(convosData.flatMap(c => c.participant_ids))];
          const otherParticipantIds = participantIds.filter(id => id !== user.id);

          if (otherParticipantIds.length === 0) {
            setConversations([]);
            setLoading(false);
            return;
          }

          const { data: profilesData, error: profilesError } = await supabase
            .rpc('get_user_profiles_by_ids', { user_ids: otherParticipantIds });

          if (profilesError) throw profilesError;

          const usersMap = new Map(profilesData.map(p => [p.id, p]));

          const formattedConversations = convosData.map(convo => {
            const otherParticipantId = convo.participant_ids.find(pId => pId !== user.id);
            const otherUser = usersMap.get(otherParticipantId);
            const lastMsg = convo.messages[0];
            let lastMessageText = 'Aucun message';
            if (lastMsg) {
              lastMessageText = lastMsg.image_url ? 'Photo' : lastMsg.content;
            }
            
            return {
              id: convo.id,
              other_user_id: otherParticipantId,
              name: otherUser?.name || 'Utilisateur',
              avatar: otherUser?.avatar_url || `https://i.pravatar.cc/150?u=${otherParticipantId}`,
              lastMessage: lastMessageText,
              timestamp: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
            };
          }).sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.localeCompare(a.timestamp);
          });

          setConversations(formattedConversations);

        } catch (error) {
          console.error('Error fetching conversations:', error);
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les conversations.' });
        } finally {
          setLoading(false);
        }
      }, [user]);

      useEffect(() => {
        fetchConversations();
      }, [fetchConversations]);

      // Effect to handle direct navigation to a conversation
      useEffect(() => {
        const handleDirectConversationLoad = async () => {
            const targetConversationId = location.state?.conversationId;
            if (!targetConversationId || !user) return;

            if (selectedConversation?.id === targetConversationId) return;

            const existingConvo = conversations.find(c => c.id === targetConversationId);
            if (existingConvo) {
                setSelectedConversation(existingConvo);
                return;
            }

            try {
                setLoadingMessages(true);
                const { data: newConvoData, error: newConvoError } = await supabase
                    .from('conversations')
                    .select('id, participant_ids')
                    .eq('id', targetConversationId)
                    .single();

                if (newConvoError) throw newConvoError;

                if (newConvoData) {
                    const otherParticipantId = newConvoData.participant_ids.find(pId => pId !== user.id);
                    if (!otherParticipantId) return;

                    const { data: profileData, error: profileError } = await supabase
                        .rpc('get_user_profiles_by_ids', { user_ids: [otherParticipantId] });

                    if (profileError) throw profileError;

                    const otherUser = profileData[0];
                    if (otherUser) {
                        const convoToSelect = {
                            id: newConvoData.id,
                            other_user_id: otherParticipantId,
                            name: otherUser.name || 'Utilisateur',
                            avatar: otherUser.avatar_url || `https://i.pravatar.cc/150?u=${otherParticipantId}`,
                            lastMessage: 'Nouvelle conversation',
                            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        };
                        
                        setConversations(prev => {
                            if (prev.find(c => c.id === convoToSelect.id)) return prev;
                            return [convoToSelect, ...prev];
                        });
                        setSelectedConversation(convoToSelect);
                    }
                }
            } catch (error) {
                console.error("Error loading direct conversation:", error);
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger cette conversation.' });
            } finally {
                setLoadingMessages(false);
            }
        };

        if (!loading) {
            handleDirectConversationLoad();
        }
    }, [location.state, user, conversations, loading, selectedConversation?.id]);

      const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        setLoadingMessages(true);
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les messages.' });
        } finally {
          setLoadingMessages(false);
        }
      }, []);

      useEffect(() => {
        if (selectedConversation) {
          fetchMessages(selectedConversation.id);
        }
      }, [selectedConversation, fetchMessages]);

      useEffect(() => {
        const channel = supabase
          .channel('public:messages')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
            if (payload.eventType === 'INSERT' && payload.new.conversation_id === selectedConversation?.id) {
              setMessages((prevMessages) => [...prevMessages, payload.new]);
            }
            if (payload.eventType === 'UPDATE' && payload.new.conversation_id === selectedConversation?.id) {
              setMessages((prevMessages) => prevMessages.map(m => m.id === payload.new.id ? payload.new : m));
            }
            if (payload.eventType === 'DELETE' && payload.old.conversation_id === selectedConversation?.id) {
              setMessages((prevMessages) => prevMessages.filter(m => m.id !== payload.old.id));
            }
            fetchConversations();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [selectedConversation, fetchConversations]);

      const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageFile) || !selectedConversation || !user) return;

        setSendingMessage(true);
        const content = newMessage.trim();
        let imageUrl = null;

        try {
          if (imageFile) {
            const fileName = `${user.id}/${uuidv4()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('chat-images')
              .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('chat-images')
              .getPublicUrl(uploadData.path);
            
            imageUrl = urlData.publicUrl;
          }

          const { error: insertError } = await supabase
            .from('messages')
            .insert({
              conversation_id: selectedConversation.id,
              sender_id: user.id,
              content: content || null,
              image_url: imageUrl,
            });

          if (insertError) throw insertError;

          setNewMessage('');
          setImageFile(null);
          setImagePreview(null);

        } catch (error) {
          console.error('Error sending message:', error);
          toast({ variant: 'destructive', title: 'Erreur', description: "Le message n'a pas pu être envoyé." });
        } finally {
          setSendingMessage(false);
        }
      };

      const handleEditMessage = async () => {
        if (!editingMessage || !editingContent.trim()) return;

        const { error } = await supabase
          .from('messages')
          .update({ content: editingContent, updated_at: new Date().toISOString() })
          .eq('id', editingMessage.id);

        if (error) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier le message.' });
        } else {
          setEditingMessage(null);
          setEditingContent('');
        }
      };

      const handleDeleteMessage = async () => {
        if (!deletingMessage) return;

        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', deletingMessage.id);

        if (error) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le message.' });
        }
        setDeletingMessage(null);
      };

      const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
        } else {
          toast({ title: "Fichier non valide", description: "Veuillez sélectionner une image.", variant: "warning" });
        }
      };

      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      useEffect(() => {
        if (editingMessage && editInputRef.current) {
          editInputRef.current.focus();
        }
      }, [editingMessage]);

      const handleUnsupportedFeature = () => {
        toast({
          title: "🚧 Cette fonctionnalité n'est pas encore implémentée",
          description: "Mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
        });
      };

      return (
        <>
          <div className="h-full bg-gray-50 md:p-4 lg:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto w-full bg-white rounded-none md:rounded-2xl card-shadow overflow-hidden flex flex-1">
              <div className={`w-full md:w-2/5 lg:w-1/3 border-r border-gray-200 flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-black mb-4">Messages</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    </div>
                  ) : (
                    conversations.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedConversation(chat)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedConversation?.id === chat.id ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                              <img 
                                className="w-full h-full object-cover"
                                alt={`Avatar of ${chat.name}`}
                                src={chat.avatar} />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-black truncate">{chat.name}</h3>
                              <span className="text-xs text-gray-500">{chat.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className={`w-full md:flex-1 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                  <>
                    <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="relative">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            <img 
                              className="w-full h-full object-cover"
                              alt={`Avatar of ${selectedConversation.name}`}
                              src={selectedConversation.avatar} />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-black">{selectedConversation.name}</h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button onClick={handleUnsupportedFeature} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Phone className="w-5 h-5 text-gray-600" /></button>
                        <button onClick={handleUnsupportedFeature} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Video className="w-5 h-5 text-gray-600" /></button>
                        <button onClick={handleUnsupportedFeature} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <ContextMenu key={msg.id}>
                            <ContextMenuTrigger disabled={msg.sender_id !== user.id}>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex group ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md rounded-2xl my-1 relative ${
                                    msg.sender_id === user.id
                                      ? 'bg-yellow-400 text-black rounded-br-lg'
                                      : 'bg-gray-200 text-black rounded-bl-lg'
                                  } ${!msg.content && msg.image_url ? 'p-1' : 'px-4 py-2'}`}
                                >
                                  {editingMessage?.id === msg.id ? (
                                    <div className="flex items-center">
                                      <input
                                        ref={editInputRef}
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="bg-white/50 text-black rounded-md px-2 py-1 w-full focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditMessage()}
                                      />
                                      <button onClick={handleEditMessage} className="p-2 text-green-600 hover:text-green-800"><Check size={18} /></button>
                                      <button onClick={() => setEditingMessage(null)} className="p-2 text-red-600 hover:text-red-800"><X size={18} /></button>
                                    </div>
                                  ) : (
                                    <>
                                      {msg.image_url && (
                                        <img src={msg.image_url} alt="Contenu du message" className="rounded-xl max-w-full h-auto" />
                                      )}
                                      {msg.content && <p className="text-sm mt-1 break-words">{msg.content}</p>}
                                      <div className="text-xs opacity-70 mt-1 text-right flex items-center justify-end">
                                        {msg.updated_at && <span className="mr-1 italic text-xs">modifié</span>}
                                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            </ContextMenuTrigger>
                            {msg.sender_id === user.id && (
                              <ContextMenuContent>
                                {msg.content && (
                                  <ContextMenuItem onClick={() => { setEditingMessage(msg); setEditingContent(msg.content); }} className="flex items-center">
                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                  </ContextMenuItem>
                                )}
                                <ContextMenuItem onClick={() => setDeletingMessage(msg)} className="flex items-center text-red-600 focus:text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </ContextMenuItem>
                              </ContextMenuContent>
                            )}
                          </ContextMenu>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-200 bg-white">
                      {imagePreview && (
                        <div className="relative w-24 h-24 mb-2 p-2 border rounded-lg">
                          <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex space-x-2 sm:space-x-3 items-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Paperclip className="w-5 h-5 text-gray-600" />
                        </button>
                        <button type="button" onClick={handleUnsupportedFeature} className="hidden sm:block p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                          <Smile className="w-5 h-5 text-gray-600" />
                        </button>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Tapez votre message..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && !imageFile) || sendingMessage}
                          className="bg-yellow-400 text-black p-2 sm:p-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                        >
                          {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-5xl sm:text-6xl mb-4">💬</div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                        Sélectionnez une conversation
                      </h3>
                      <p className="text-gray-600">
                        Commencez à discuter avec les vendeurs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <AlertDialog open={!!deletingMessage} onOpenChange={() => setDeletingMessage(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le message sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    };

    export default ChatPage;