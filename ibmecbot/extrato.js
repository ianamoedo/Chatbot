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
        let table = `| **DATA COMPRA** | **DESCRIÇÃO** | **VALOR** |\n`;
        table += `|---|---|---|\n`; // Linha separadora para tabela Markdown
    
        response.forEach(element => {
            table += `| ${format("dd/MM/yyyy", new Date(element.dataTransacao))} | ${element.descricao} | R$ ${element.valor.toFixed(2)} |\n`;
        });
    
        return table;
    }
}

module.exports.Extrato = Extrato;