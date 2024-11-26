const { MessageFactory } = require('botbuilder');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { Produto } = require('../produto');
const { Extrato } = require('../extrato');

const NAME_PROMPT = 'NAME_PROMPT';
const CARD_NUMBER_PROMPT = 'CARD_NUMBER_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

// Definição de constantes externas às funções
const CARD_OPTIONS = ['Consultar Pedidos', 'Extrato de Compras'];
const CHOICES = ['Consultar Pedidos', 'Consultar Produtos', 'Extrato de Compras'];
const PROMPT_MESSAGES = {
    selectOption: 'Por favor, selecione uma das opções disponíveis:',
    enterCardNumber: 'Digite o número do seu cartão:',
    enterProductName: 'Digite o nome do produto que deseja consultar:',
    enterCPF: 'Insira o seu CPF para continuar:',
    anythingElse: 'Você deseja algo a mais?',
    yesNoRetry: 'Responda com yes ou no.'
};

class ProductDialog extends ComponentDialog {
    constructor(userState) {
        super('productDialog');

        this.userProfile = userState.createProperty(MAIN_DIALOG);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new TextPrompt(CARD_NUMBER_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.displayMenuStep.bind(this),
            this.processInputStep.bind(this),
            this.requestCardStep.bind(this),
            this.finalStep.bind(this),
            this.additionalOptionsStep.bind(this), 
            this.handleAdditionalOptions.bind(this) 
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async displayMenuStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: PROMPT_MESSAGES.selectOption,
            choices: ChoiceFactory.toChoices(CHOICES)
        });
    }

    async processInputStep(step) {
        step.values.userChoice = step.result.value;

        const promptMessage = step.values.userChoice === 'Consultar Produtos'
            ? PROMPT_MESSAGES.enterProductName
            : PROMPT_MESSAGES.enterCPF;

        return await step.prompt(NAME_PROMPT, { prompt: promptMessage });
    }

    async requestCardStep(step) {
        step.values.userInput = step.result;

        if (CARD_OPTIONS.includes(step.values.userChoice)) {
            return await step.prompt(CARD_NUMBER_PROMPT, { prompt: PROMPT_MESSAGES.enterCardNumber });
        }

        return step.next();
    }

    async finalStep(step) {
        const userChoice = step.values.userChoice;

        try {
            if (CARD_OPTIONS.includes(userChoice)) {
                const userId = step.values.userInput;

                if (!userId) {
                    await step.context.sendActivity('Id não fornecido. Por favor, tente novamente.');
                    return await step.replaceDialog(this.initialDialogId);
                }

                const extrato = new Extrato();

                let extratoResponse;
                try {
                    extratoResponse = await extrato.getExtratoByIdCliente(userId);
                    console.log('Extrato encontrado:', extratoResponse.data);
                } catch (error) {
                    console.error('Erro ao obter o extrato:', error);
                    await step.context.sendActivity('Não foi possível obter o extrato para o cartão fornecido. Verifique os dados e tente novamente.');
                    return await step.replaceDialog(this.initialDialogId);
                }

                if (!extratoResponse.data || extratoResponse.data.length === 0) {
                    await step.context.sendActivity('Nenhum extrato disponível para os dados fornecidos.');
                    return await step.replaceDialog(this.initialDialogId);
                }

                const formattedExtrato = extrato.formatExtrato(extratoResponse.data);
                await step.context.sendActivity(MessageFactory.text(formattedExtrato));

            } else if (userChoice === 'Consultar Produtos') {
                const productName = step.values.userInput;
                const produto = new Produto();

                let productResponse;
                try {
                    productResponse = await produto.getProduto(productName);
                    console.log('Resposta da API para Produto:', productResponse.data);
                } catch (error) {
                    console.error('Erro ao obter o produto:', error);
                    await step.context.sendActivity('Não foi possível encontrar o produto fornecido. Verifique o nome e tente novamente.');
                    return await step.replaceDialog(this.initialDialogId);
                }

                if (!productResponse.data || productResponse.data.length === 0) {
                    await step.context.sendActivity(`Não foram encontrados produtos com o nome "${productName}".`);
                    return await step.replaceDialog(this.initialDialogId);
                } else {
                    const productCard = produto.createProductCard(productResponse.data[0]);
                    await step.context.sendActivity({ attachments: [productCard] });
                }
            }
        } catch (error) {
            console.error('Erro ao processar a solicitação:', error);
            await step.context.sendActivity('Houve um problema ao processar sua solicitação. Por favor, tente novamente.');
            return await step.replaceDialog(this.initialDialogId);
        }

        return await step.next(); 
    }

    async additionalOptionsStep(step) {
        return await step.prompt(CONFIRM_PROMPT, {
            prompt: PROMPT_MESSAGES.anythingElse,
            retryPrompt: PROMPT_MESSAGES.yesNoRetry,
        });
    }

    async handleAdditionalOptions(step) {
        if (step.result) {
            return await step.replaceDialog(this.initialDialogId);
        } else {
            await step.context.sendActivity('Até a próxima!');
            return await step.endDialog();
        }
    }
}

module.exports.ProductDialog = ProductDialog;
