# Investigação estatística da dependência entre os turnos — Brasil 2026

Data da análise: 26/10/2026. Universo municipal: 5.757 unidades do arquivo oficial do TSE, incluindo 5.570 municípios/DF e unidades eleitorais do exterior. Os 11.514 arquivos municipais EA20 dos dois turnos foram obtidos sem falhas. Hash SHA-256 canônico do conjunto normalizado: `8a26b8e336ec6e765f1ae6c54ac8137a06741ab7d42ae25dd6c519c0c54f20cb`.

## Resultado objetivo

O número **9.316.747** aparece necessariamente porque ele é, por definição, a parcela dos votos válidos do primeiro turno que não pertencia aos dois finalistas. Quando se subtrai a contabilidade do primeiro turno da contabilidade do segundo, essa parcela entra inteira na equação.

Não foi encontrada, nos testes executados, uma regularidade exata adicional independente dessa identidade. A igualdade também fechou, com resíduo zero, em cada uma das 5.757 unidades municipais/exteriores. Isso fortalece a conclusão de que o fechamento é local e algébrico, não uma coincidência nacional produzida posteriormente.

Esse resultado não prova nem exclui fraude por outros mecanismos. Ele demonstra que **a igualdade apresentada não acrescenta evidência probabilística de fraude, previsão algorítmica ou geração sintética**.

### Busca e diagnóstico automáticos

O painel encontra 29 matrizes de transição compatíveis sem exigir parâmetros do usuário. Todas reproduzem as margens nacionais com resíduo inferior a 0,0001 voto, mas produzem faixas muito amplas para os destinos dos eleitores eliminados, demonstrando a não identificação ecológica.

O modelo nacional de pesquisas (seis institutos, última rodada elegível por instituto) estimou margem Lula–Flávio de −1,67 p.p., com desvio preditivo total de 2,97 p.p. A margem oficial observada foi +3,57 p.p.: z = 1,76 e cauda bilateral de 7,8%. Uma alternativa ampla de deslocamento não explicado teve razão de verossimilhança de 1,62 contra o modelo convencional. Isso indica surpresa moderada sob estas premissas, não probabilidade de fraude: a alternativa também inclui erro de pesquisa, mudança tardia e comparecimento diferencial.

Com taxas-base hipotéticas de 0,1%, 0,5%, 1%, 5% e 10%, as posteriores condicionais são 0,2%, 0,8%, 1,6%, 7,9% e 15,3%. A dependência da resposta em relação à taxa-base mostra por que uma porcentagem única de fraude não é identificável pelos dados agregados.

## 1. Totais originais confirmados

| Grandeza | 1º turno | 2º turno | Variação |
|---|---:|---:|---:|
| Comparecimento | 125.275.835 | 128.236.074 | +2.960.239 |
| Abstenção | 33.469.244 | 30.509.005 | −2.960.239 |
| Votos válidos | 119.300.788 | 124.082.273 | +4.781.485 |
| Brancos | 2.300.798 | 1.430.496 | −870.302 |
| Nulos | 3.674.249 | 2.723.305 | −950.944 |
| Lula | 53.879.538 | 64.256.232 | +10.376.694 |
| Flávio Bolsonaro | 56.104.503 | 59.826.041 | +3.721.538 |

Votos válidos dos eliminados no primeiro turno:

`119.300.788 − 53.879.538 − 56.104.503 = 9.316.747`.

Aumento dos finalistas:

`10.376.694 + 3.721.538 = 14.098.232`.

Decomposição:

`9.316.747 + 2.960.239 + 870.302 + 950.944 = 14.098.232`.

## 2. Demonstração matemática

Defina, em cada turno `t`:

- `C_t`: comparecimento;
- `B_t`: votos brancos;
- `N_t`: votos nulos;
- `F_t`: votos válidos dos dois finalistas;
- `E_1`: votos válidos dos candidatos eliminados no primeiro turno.

Por definição das categorias:

`C_1 = F_1 + E_1 + B_1 + N_1`

`C_2 = F_2 + B_2 + N_2`

Subtraindo e isolando `F_2 − F_1`:

`F_2 − F_1 = E_1 + (C_2 − C_1) + (B_1 − B_2) + (N_1 − N_2)`.

Logo, `E_1 = 9.316.747` não é uma variável escolhida pelo segundo turno. É o termo que resta quando os votos válidos do primeiro turno são particionados entre finalistas e eliminados. Qualquer outro valor oficial de `E_1` apareceria integralmente na mesma equação.

As quatro parcelas do lado direito não são quatro observações estatisticamente independentes do lado esquerdo: elas definem o lado esquerdo por conservação contábil. Por isso, não se deve multiplicar probabilidades independentes nem calcular a “chance de a soma coincidir”. Condicionada à consistência das categorias, essa chance é 100%.

## 3. Teste municipal independente

A equação foi recalculada usando somente os dados de cada unidade, sem ratear o total nacional:

- unidades comparáveis: 5.757;
- presentes apenas no primeiro turno: 0;
- presentes apenas no segundo turno: 0;
- identidades locais exatas: 5.757;
- resíduos locais diferentes de zero: 0;
- soma dos resíduos locais: 0;
- maior resíduo absoluto: 0.

Portanto, o fechamento nacional é a soma de fechamentos locais. O mesmo resultado seria esperado em dados convencionais sempre que as categorias locais fossem completas e internamente consistentes.

## 4. Padrões além da identidade

As correlações brutas entre votos dos eliminados e aumentos dos finalistas são muito altas (`r=0,985` com Lula; `r=0,987` com Flávio), mas são dominadas pelo tamanho dos municípios: cidades maiores têm mais votos em todas as categorias.

Depois de transformar as quantidades em taxas por mil eleitores aptos do primeiro turno:

- eliminados × aumento combinado dos finalistas: `r=0,637`;
- eliminados × aumento de Lula: `r=0,392`;
- eliminados × aumento de Flávio: `r=0,663`.

Essas associações são compatíveis com transferência parcial, comparecimento diferencial e heterogeneidade territorial. Elas não identificam trajetórias individuais e não são relações exatas adicionais.

Aumento do comparecimento municipal:

- mediana: +134;
- percentil 25: +22;
- percentil 75: +378;
- percentil 5: −290;
- percentil 95: +1.740.

Existem municípios com aumento e com redução de comparecimento, brancos e nulos. Isso contraria a interpretação de que cada uma das quatro parcelas nacionais represente um bloco fixo de pessoas transferido integralmente.

## 5. Recortes subestaduais

Foram calculadas 510 Regiões Geográficas Imediatas, 133 Intermediárias e recortes declarados. Exemplos:

| Região | Municípios | Aumento dos finalistas | Eliminados 1T | Δ comparecimento | Resíduo |
|---|---:|---:|---:|---:|---:|
| Sul/Sudoeste de Minas | 146 | 209.009 | 130.319 | 50.514 | 0 |
| Zona da Mata de Minas | 142 | 175.425 | 98.301 | 52.908 | 0 |
| Norte/Noroeste de São Paulo | 175 | 316.169 | 194.086 | 86.762 | 0 |

O fechamento regional também é esperado pela mesma álgebra.

## 6. Modelos probabilísticos

O modelo reverso usa balanceamento biproporcional para gerar muitas matrizes de transferência com as mesmas margens observadas. Ele demonstra não identificação: alta abstenção dos eliminados, maior transferência para Lula ou Flávio e mobilização de antigos abstencionistas podem produzir exatamente os mesmos totais.

Um modelo reverso ajustado após observar o segundo turno não mede surpresa e não pode ser apresentado como previsão.

Para um teste preditivo independente seria necessário:

1. fixar antes da eleição probabilidades de transição e comparecimento por grupo;
2. registrar pesquisas, população-alvo e erro entre institutos;
3. calibrar erro histórico usando eleições anteriores;
4. gravar previsão e hash antes de liberar o segundo turno;
5. comparar estatísticas previamente escolhidas, corrigindo testes múltiplos.

O programa implementa o bloqueio temporal e o compromisso criptográfico, mas não inventa pesquisas nem taxas de transferência ausentes. Sem uma previsão pré-registrada, não há p-valor prospectivo válido para o resultado de 2026.

## 7. Algoritmos, otimização e geração sintética

O fato de um algoritmo conseguir reproduzir os totais depois de conhecê-los não é evidência de que o algoritmo os gerou. IPF, programação linear e milhares de matrizes de fluxo conseguem fazê-lo porque o problema é subdeterminado.

Para distinguir geração algorítmica de explicações convencionais seriam necessárias assinaturas definidas antecipadamente e independentes da identidade, como:

- resíduos seccionais incompatíveis com boletins de urna;
- dependência serial ou espacial não explicada por demografia e geografia;
- arredondamentos, restrições ou padrões digitais específicos do algoritmo proposto;
- documentação, logs ou código ligando o sistema ao processo;
- desempenho fora da amostra superior a modelos eleitorais convencionais;
- replicação por auditores independentes.

Nenhuma dessas evidências decorre do número 9.316.747 ou do fechamento da soma.

## 8. Probabilidade de fraude

Uma probabilidade posterior exige taxa-base e verossimilhanças sob fraude e não fraude. O painel oferece uma calculadora bayesiana condicional, mas deixa taxa-base, distribuição preditiva e mecanismo de fraude em branco. Isso evita transformar escolhas arbitrárias em uma porcentagem aparentemente objetiva.

Muitas variáveis não implicam maior probabilidade de fraude. Sem validação, mais parâmetros geralmente aumentam a flexibilidade e a incerteza do modelo.

## 9. Dados por seção

O arquivo presidencial por seção disponível no catálogo em 26/10/2026 informava geração em 06/10/2026 e continha o primeiro turno. Como o segundo turno comparável ainda não estava presente, a análise seccional foi bloqueada. O adaptador está pronto para reexecução quando os dois turnos forem publicados.

## 10. Conclusão

- **Identidade matemática:** demonstrada nacionalmente, municipalmente e regionalmente.
- **Correlação estatística:** existe nos agregados; cai ao controlar parcialmente o tamanho por taxas e permanece sujeita à inferência ecológica.
- **Dependência além da identidade:** não foi encontrada relação exata adicional nos testes executados.
- **Evidência de geração ou previsão algorítmica:** não identificada.
- **Evidência de uso de sistema específico:** inexistente nos totais analisados.
- **Hipótese de fraude:** não é confirmada nem descartada em geral; esta relação numérica específica não fornece evidência independente a favor dela.

## Como executar no Windows e VS Code

Pré-requisito: Node.js 20 ou superior.

```powershell
cd "C:\Users\farfo\Documents\Codex\2026-10-26\projeto-analisador-reverso-eleitoral-brasil-2026-2"
npm install
npm test
npm start
```

Abra `http://localhost:3000`.

Para baixar/reprocessar todos os municípios:

```powershell
npm run fetch:municipal
npm run regions
npm run export
```

Para conferir o esquema real de um CSV:

```powershell
npm run profile -- --file="CAMINHO_DO_ARQUIVO.csv"
```

Para processar CSVs municipais do catálogo:

```powershell
npm run analyze -- --detail="CAMINHO_DETALHE_BRASIL.csv" --candidates="PASTA_DOS_CSVS_DE_CANDIDATOS"
```

Os dados brutos ficam em `data/raw/`, os resultados normalizados em `data/processed/` e as entregas em `outputs/`.
