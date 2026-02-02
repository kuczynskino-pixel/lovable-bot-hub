import { PermissionFlagsBits } from 'discord.js';
import { getConfig } from '../services/config-store.js';

/**
 * Check if a member has permission to manage hurtownie
 * @param {GuildMember} member 
 * @returns {boolean}
 */
export async function hasPermission(member) {
  // Server owner always has access
  if (member.id === member.guild.ownerId) {
    return true;
  }

  // Discord Administrator permission
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const config = getConfig();
  
  // Check admin role
  const adminRoleId = config.adminRoleId || process.env.ADMIN_ROLE_ID;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) {
    return true;
  }

  // Check editor role
  const editorRoleId = config.editorRoleId || process.env.EDITOR_ROLE_ID;
  if (editorRoleId && member.roles.cache.has(editorRoleId)) {
    return true;
  }

  return false;
}
