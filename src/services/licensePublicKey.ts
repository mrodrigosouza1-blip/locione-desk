/**
 * Chave pública Ed25519 SPKI DER base64
 * Ponto único de verdade para a chave pública usada na verificação de licenças
 * 
 * Esta chave corresponde à chave privada usada no servidor (Admin_Site) para assinar tokens LOCIONE1
 * A chave pública deve ser copiada do servidor após gerar o par de chaves
 */

/**
 * Chave pública Ed25519 no formato SPKI DER base64
 * Esta constante deve ser substituída pela chave pública real gerada no Admin_Site
 */
export const SITE_PUBLIC_KEY_ED25519 =
  "MCowBQYDK2VwAyEAAzdoqqWo/EmhUSEgEBdgsPT0tJf4hW1j72nV/JC2CkM=";

/**
 * @deprecated Use SITE_PUBLIC_KEY_ED25519 em vez disso
 * Mantido para compatibilidade temporária
 */
export const DEFAULT_PUBLIC_KEY_ED25519_SPKI_DER_BASE64 = SITE_PUBLIC_KEY_ED25519;