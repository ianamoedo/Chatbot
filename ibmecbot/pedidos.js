const axios = require('axios').default;

class Pedidos {
    // Configuração da URL e da chave de acesso da API
    urlApi = process.env.PEDIDOS_URL_API;
    apiKey = process.env.GATEWAY_ACCESS_KEY;

    // Método para obter pedidos com base no CPF e número do cartão
    async getPedidos(cpf, numeroCartao) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };

        try {
            // Realiza a requisição GET para obter os pedidos
            const response = await axios.get(`${this.urlApi}?cpf=${cpf}&numeroCartao=${numeroCartao}`, { headers: headers });
            return response;
        } catch (error) {
            // Loga o erro no console para facilitar depuração e lança o erro para ser tratado
            console.error('Erro ao obter pedidos:', error);
            throw error;
        }
    }

    // Método para formatar os pedidos para uma apresentação mais clara ao usuário
    formatPedidos(response) {
        if (!response || !response.data || response.data.length === 0) {
            return 'Nenhum pedido encontrado para os dados fornecidos.';
        }
        
        let pedidosFormatados = 'Lista de Pedidos:\n\n';
        response.data.forEach((pedido, index) => {
            pedidosFormatados += `Pedido ${index + 1}:\n`;
            pedidosFormatados += `- Data do Pedido: ${pedido.dataPedido}\n`;
            pedidosFormatados += `- Valor Total: R$ ${pedido.valorTotal}\n`;
            pedidosFormatados += `- Status: ${pedido.status}\n\n`;
        });

        return pedidosFormatados;
    }
}

module.exports.Pedidos = Pedidos;
