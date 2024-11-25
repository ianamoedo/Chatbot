const axios = require('axios').default;
const { CardFactory } = require('botbuilder');
const format = require('date-format');

class Extrato {
    urlApi = process.env.EXTRATO_URL_API;
    apiKey = process.env.GATEWAY_ACCESS_KEY;

    async getIdByCPF(cpf) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };

        try {
            return await axios.get(`${this.urlApi}/buscar-id-por-cpf?cpf=${cpf}`, { headers: headers });
        } catch (error) {
            console.error('Erro ao obter ID pelo CPF:', error);
            throw error;
        }
    }

    async getExtrato(idUser, numeroCartao) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };

        try {
            return await axios.get(`${this.urlApi}/${idUser}?numeroCartao=${numeroCartao}`, { headers: headers });
        } catch (error) {
            console.error('Erro ao obter extrato:', error);
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
