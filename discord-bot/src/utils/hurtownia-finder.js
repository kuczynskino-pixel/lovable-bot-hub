/**
 * Find a hurtownia thread by name (fuzzy match)
 * @param {TextChannel} channel 
 * @param {string} searchName 
 * @returns {Promise<{message, thread, data, threadUrl} | null>}
 */
export async function findHurtowniaThread(channel, searchName) {
  const searchLower = searchName.toLowerCase().trim();
  
  // Fetch recent messages
  const messages = await channel.messages.fetch({ limit: 100 });
  
  for (const message of messages.values()) {
    // Check if message has our hurtownia embed
    if (!message.embeds.length) continue;
    
    const embed = message.embeds[0];
    if (!embed.description) continue;
    
    // Try to parse JSON from embed description
    try {
      const jsonMatch = embed.description.match(/```json\n([\s\S]+?)\n```/);
      if (!jsonMatch) continue;
      
      const data = JSON.parse(jsonMatch[1]);
      
      // Check if name matches (case-insensitive, partial match)
      if (data.nazwa && data.nazwa.toLowerCase().includes(searchLower)) {
        // Find associated thread
        const thread = message.thread || 
          channel.threads.cache.find(t => t.name.includes(data.nazwa));
        
        return {
          message,
          thread,
          data,
          threadUrl: thread ? thread.url : message.url,
        };
      }
    } catch (e) {
      // Not a valid hurtownia message, skip
      continue;
    }
  }
  
  return null;
}

/**
 * Get all hurtownie from channel
 * @param {TextChannel} channel 
 * @returns {Promise<Array<{message, thread, data, threadUrl}>>}
 */
export async function getAllHurtownie(channel) {
  const hurtownie = [];
  
  // Fetch messages (may need pagination for large channels)
  const messages = await channel.messages.fetch({ limit: 100 });
  
  for (const message of messages.values()) {
    if (!message.embeds.length) continue;
    
    const embed = message.embeds[0];
    if (!embed.description) continue;
    
    try {
      const jsonMatch = embed.description.match(/```json\n([\s\S]+?)\n```/);
      if (!jsonMatch) continue;
      
      const data = JSON.parse(jsonMatch[1]);
      
      if (data.nazwa) {
        const thread = message.thread || 
          channel.threads.cache.find(t => t.name.includes(data.nazwa));
        
        hurtownie.push({
          message,
          thread,
          data,
          threadUrl: thread ? thread.url : message.url,
        });
      }
    } catch (e) {
      continue;
    }
  }
  
  // Sort by name
  hurtownie.sort((a, b) => a.data.nazwa.localeCompare(b.data.nazwa, 'pl'));
  
  return hurtownie;
}
