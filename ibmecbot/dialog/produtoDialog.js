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
const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ProductDialog extends ComponentDialog {
    constructor(userState) {
        super('productDialog');

        this.userProfile = userState.createProperty(MAIN_DIALOG);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new TextPrompt(CARD_NUMBER_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.displayMenuStep.bind(this),
            this.processInputStep.bind(this),
            this.requestCardStep.bind(this),
            this.finalStep.bind(this)
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
        const promptMessage = 'Por favor, selecione uma das opções disponíveis:';
        const choices = ['Consultar Pedidos', 'Consultar Produtos', 'Extrato de Compras'];
        return await step.prompt(CHOICE_PROMPT, {
            prompt: promptMessage,
            choices: ChoiceFactory.toChoices(choices)
        });
    }

    async processInputStep(step) {
        step.values.userChoice = step.result.value;

        const promptMessage = step.values.userChoice === 'Consultar Produtos'
            ? 'Digite o nome do produto que deseja consultar:'
            : 'Insira o seu CPF para continuar:';

        return await step.prompt(NAME_PROMPT, { prompt: promptMessage });
    }

    async requestCardStep(step) {
        step.values.userInput = step.result;

        if (['Consultar Pedidos', 'Extrato de Compras'].includes(step.values.userChoice)) {
            const promptMessage = 'Digite o número do seu cartão:';
            return await step.prompt(CARD_NUMBER_PROMPT, { prompt: promptMessage });
        }

        return step.next();
    }

    async finalStep(step) {
        const userChoice = step.values.userChoice;

        try {
            if (userChoice === 'Consultar Pedidos' || userChoice === 'Extrato de Compras') {
                const cpf = step.values.userInput;
                const cardNumber = step.result;

                const extrato = new Extrato();
                const idResponse = await extrato.getIdByCPF(cpf);

                if (!idResponse.data || !idResponse.data.id) {
                    throw new Error('Nenhum ID encontrado para o CPF fornecido.');
                }

                const userId = idResponse.data.id;
                const extratoResponse = await extrato.getExtrato(userId, cardNumber);

                if (!extratoResponse.data) {
                    throw new Error('Nenhum extrato disponível para os dados fornecidos.');
                }

                const formattedExtrato = extrato.formatExtrato(extratoResponse.data);
                await step.context.sendActivity(MessageFactory.text(formattedExtrato));
            } else if (userChoice === 'Consultar Produtos') {
                const productName = step.values.userInput;
                const produto = new Produto();

                const productResponse = await produto.getProduto(productName);

                if (!productResponse.data || productResponse.data.length === 0) {
                    await step.context.sendActivity(`Não foram encontrados produtos com o nome "${productName}".`);
                } else {
                    const productCard = produto.createProductCard(productResponse.data[0]);
                    await step.context.sendActivity({ attachments: [productCard] });
                }
            }
        } catch (error) {
            console.error('Erro ao processar a solicitação:', error);
            await step.context.sendActivity('Houve um problema ao processar sua solicitação.');
        }

        return await step.endDialog();
    }
}

module.exports.ProductDialog = ProductDialog;