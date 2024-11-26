const axios = require('axios').default;
const { CardFactory } = require('botbuilder');
const format = require('date-format');

class Extrato {
    urlWeb = "https://projetocloud-ecommerce-api-bjb0e9dycgbkckhu.centralus-01.azurewebsites.net";
    apiKey = process.env.GATEWAY_ACCESS_KEY;

    async getExtratoByIdCliente(IdCliente) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };

        try {
            return await axios.get(`${this.urlWeb}/extratos/cliente/${IdCliente}`);
        } catch (error) {
            console.error('Erro ao obter ID pelo CPF:', error);
            throw error;
        }
    }

    formatExtrato(response) {
        let table = `| **DATA COMPRA** | **DESCRICAO** | **VALOR** |\n\n`;
        response.forEach(element => {
            table += `| **${format("dd/MM/yyyy", new Date(element.dataTransacao))}** | **${element.comerciante}** | **R$ ${element.valor}** |\n`;
        });

        return table;
    }
}

module.exports.Extrato = Extrato;