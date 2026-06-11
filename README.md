# expense-tracker-app

App mobile para o **Mini Organizador de Gastos Financeiros**.

**Stack:** React Native · Expo SDK 52 · TypeScript

---

## Pré-requisitos

- Node.js >= 18
- Expo Go instalado no celular ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Backend rodando (`expense-tracker-api`)

---

## Instalação

```bash
git clone <url-do-repo>
cd expense-tracker-app
npm install
```

---

## Configuração

Crie o arquivo `.env` na raiz:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000/api
```

> **Importante:** use o IP da sua máquina na rede local — não `localhost` —
> pois o celular físico não consegue resolver `localhost` do computador.
>
> Encontre seu IP:
> - Windows: `ipconfig` → "Endereço IPv4"
> - Mac/Linux: `ifconfig` ou `ip a`

---

## Execução

```bash
npx expo start
```

Escaneie o QR Code com o **Expo Go**, ou pressione:

| Tecla | Ação               |
|-------|--------------------|
| `a`   | Abrir no Android   |
| `i`   | Abrir no iOS       |
| `w`   | Abrir no navegador |

---

## Funcionalidades

| Feature                        | Descrição                                       |
|--------------------------------|-------------------------------------------------|
| 📋 Listagem de gastos           | Ordenada por data, com total do mês e total geral |
| ➕ Cadastro                     | Título, valor, categoria, data e observação     |
| ✏️ Edição                       | Edita qualquer campo do gasto existente         |
| 🗑️ Exclusão                    | Com confirmação via Alert                       |
| 🔄 Pull to refresh              | Atualiza a lista deslizando para baixo          |
| 🎨 Categorias coloridas         | Alimentação · Transporte · Lazer · Saúde · Moradia · Outros |

---

## Estrutura

```
src/
├── components/
│   └── ExpenseCard.tsx       # card de cada gasto na lista
├── screens/
│   ├── HomeScreen.tsx        # tela principal com lista e FAB
│   └── FormScreen.tsx        # tela de criação / edição
├── services/
│   └── api.ts                # chamadas HTTP (axios)
└── types/
    ├── expense.ts            # interfaces e tipos
    └── navigation.ts         # tipos do React Navigation
App.tsx                       # entry point + navegação
```
