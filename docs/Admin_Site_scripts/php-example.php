<?php
/**
 * Exemplo de implementação PHP para gerar token LOCIONE1
 * 
 * Este é um exemplo de referência. Adapte para o seu sistema Admin_Site.
 */

// Carregar variáveis de ambiente (usando dotenv ou similar)
$privateKeyBase64 = $_ENV['PRIVATE_KEY_ED25519'] ?? getenv('PRIVATE_KEY_ED25519');
$publicKeyBase64 = $_ENV['SITE_PUBLIC_KEY_ED25519'] ?? getenv('SITE_PUBLIC_KEY_ED25519');

if (!$privateKeyBase64 || !$publicKeyBase64) {
    throw new Exception('PRIVATE_KEY_ED25519 e SITE_PUBLIC_KEY_ED25519 devem estar definidas');
}

/**
 * Gera token LOCIONE1 a partir de um payload
 * 
 * @param array $payload Array associativo com: product, plan, issued_at, expires_at, max_devices
 * @return string Token no formato LOCIONE1.<payload_base64url>.<signature_base64url>
 */
function make_license_token(array $payload): string
{
    global $privateKeyBase64;
    
    // Serializar JSON sem escapar Unicode e sem escapar barras
    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    // Converter payload para base64url
    $payloadBase64 = base64_encode($payloadJson);
    $payloadB64url = strtr($payloadBase64, '+/', '-_');
    $payloadB64url = rtrim($payloadB64url, '=');
    
    // Assinar os bytes do JSON (não base64url, não "LOCIONE1...")
    $payloadBytes = $payloadJson; // PHP strings são bytes
    $signature = sodium_crypto_sign_detached($payloadBytes, base64_decode($privateKeyBase64));
    
    // Converter assinatura para base64url
    $signatureBase64 = base64_encode($signature);
    $signatureB64url = strtr($signatureBase64, '+/', '-_');
    $signatureB64url = rtrim($signatureB64url, '=');
    
    // Montar token
    return "LOCIONE1.{$payloadB64url}.{$signatureB64url}";
}

/**
 * Exemplo de uso:
 */
function example_usage()
{
    // Exemplo: Licença anual
    $payload = [
        'product' => 'locione-desk',
        'plan' => 'annual',
        'issued_at' => date('c'), // ISO 8601
        'expires_at' => date('c', strtotime('+1 year')),
        'max_devices' => 3,
        'license_id' => 'LIC-' . uniqid(),
    ];
    
    $token = make_license_token($payload);
    
    echo "Token gerado:\n";
    echo $token . "\n\n";
    
    // Exemplo: Licença lifetime
    $payloadLifetime = [
        'product' => 'locione-desk',
        'plan' => 'lifetime',
        'issued_at' => date('c'),
        'expires_at' => null,
        'max_devices' => 999,
        'license_id' => 'LIC-LIFETIME-' . uniqid(),
    ];
    
    $tokenLifetime = make_license_token($payloadLifetime);
    
    echo "Token lifetime gerado:\n";
    echo $tokenLifetime . "\n";
}

// Nota: Para usar sodium_crypto_sign_detached, você precisa:
// 1. Instalar extensão libsodium do PHP (php-sodium)
// 2. Ou usar uma biblioteca compatível como paragonie/sodium_compat
//
// Se usar paragonie/sodium_compat:
// composer require paragonie/sodium_compat
// require_once 'vendor/autoload.php';
