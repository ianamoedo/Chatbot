const axios = require('axios').default;
const { CardFactory } = require('botbuilder');

class Produto {
    urlApi = process.env.PRODUTO_URL_API;
    apiKey = process.env.GATEWAY_ACCESS_KEY;

    async getProduto(productName) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };
        
        try {
            const response = await axios.get(`${this.urlApi}?productName=${productName}`, { headers: headers });
            return response;
        } catch (error) {
            console.error('Erro ao obter o produto:', error);
            throw error;
        }
    }

    createProductCard(response) {
        return CardFactory.thumbnailCard(
            response.productName,
            [{ url: response.urlFoto }],
            [],
            {
                subtitle: `Preço do produto: ${response.price}`,
                text: response.productDescription
            }
        );
    }
}

module.exports.Produto = Produto;