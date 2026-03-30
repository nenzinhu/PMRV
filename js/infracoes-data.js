// infracoes-data.js - Versão otimizada
(() => {
  // Dados base64 otimizados com compressão gzip
  const INFRA_DATA = 'H4sIAAAAAAAAA+1d23LbOBL9FYRP80glKVK2vNmJk9hx4thO7CTZqpoHkIQk1iTAAEDL9u7fvw4AXZKQnOwkO7UPVZYlNtDN7j59Gj2n/+PJ...' // [Dados comprimidos e codificados]

  // Função para decodificar base64
  const decodeBase64 = (data) => {
    try {
      return atob(data);
    } catch (error) {
      console.error('Erro ao decodificar base64:', error);
      return '';
    }
  };

  // Função para descompactar dados (se necessário)
  const decompressData = (compressedData) => {
    // Implementação de descompressão se necessário
    // Por enquanto retorna os dados como estão
    return compressedData;
  };

  // Exporta os dados globalmente
  window.INFRACOES_CSV_BASE64 = decompressData(decodeBase64(INFRA_DATA));
})();

// Alternativa mais simples caso a compressão não seja necessária:
/*
(() => {
  const INFRA_DATA = "base64_string_aqui";
  window.INFRACOES_CSV_BASE64 = INFRA_DATA;
})();
*/
