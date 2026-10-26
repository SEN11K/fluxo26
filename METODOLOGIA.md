# Metodologia e interpretação

## 1. Contabilidade entre turnos

Para universo eleitoral constante e categorias exaustivas:

`Δ(finalistas) = votos_eliminados_1T + Δ(comparecimento) + redução(brancos) + redução(nulos)`

A fórmula é obtida substituindo `válidos = comparecimento − brancos − nulos` e `válidos_1T = finalistas_1T + eliminados_1T`. Se o eleitorado apto muda, o programa mantém comparecimento e abstenção separados e adiciona ajuste explícito de universo.

## 2. Modelo reverso

As linhas da matriz são os estados no 1º turno: Lula, Flávio Bolsonaro, eliminados (agregados ou separados quando disponível), branco/nulo e abstenção. As colunas são Lula, Flávio, branco, nulo e abstenção no 2º turno.

O balanceamento proporcional iterativo (IPF/RAS) parte de uma matriz-prior positiva e alterna ajustes de linhas e colunas até reproduzir as margens. Diferentes priors geram diferentes matrizes com erro numérico praticamente zero. Isso demonstra não identificação.

Os cenários nomeados são **hipóteses de partida**, não estimativas factuais. As soluções aleatórias usam gerador determinístico apenas para reprodutibilidade.

### Busca automática

O sistema cria cinco objetivos interpretáveis e 24 pontos de partida pseudoaleatórios reproduzíveis. Para cada um, o IPF balanceia a matriz até reproduzir os totais oficiais. As soluções, seus resíduos e as faixas mínimo–máximo são exibidos automaticamente. Uma faixa larga indica não identificação; não é necessário que o usuário escolha números para a análise funcionar.

### Evidência preditiva automática

A última pesquisa nacional pós-primeiro-turno por instituto é normalizada entre os finalistas. Um modelo de efeitos aleatórios estima a margem média e a heterogeneidade. A incerteza preditiva combina erro da meta-estimativa, heterogeneidade entre institutos e erro histórico. O painel informa escore padronizado, probabilidade bilateral de cauda e razão de verossimilhança contra uma alternativa ampla de deslocamento não explicado.

Essa alternativa não é específica de fraude: também abrange erro de pesquisa, mudança tardia, comparecimento diferencial e falha de especificação. Sem casos rotulados, taxa-base externa e mecanismo validado, a posterior de fraude não é identificável; o painel mostra sensibilidades condicionais para tornar esse limite explícito.

## 3. Identificabilidade

São observáveis: totais por candidato e categoria, por turno e unidade territorial. São estimados: células da matriz. São hipóteses: priors, limites e cenários. Não são identificáveis somente pelos agregados: transferências individuais, comparecimento por preferência anterior e causalidade.

## 4. Municípios e seções

O cruzamento é feito por código de UF e código TSE do município; zona e seção recebem zeros à esquerda. Unidades exclusivas de um turno são listadas e excluídas da comparação. A soma municipal é comparada ao total nacional. A análise calcula quantis, correlações de Pearson e outliers robustos por mediana/MAD. Correlação territorial não implica transferência individual.

A identidade contábil é recalculada dentro de cada município (e, quando importada, dentro de cada seção), usando apenas os próprios totais daquela unidade. O relatório mostra o resíduo de cada recorte e confirma se a soma dos resíduos locais coincide com o resíduo agregado. Como a igualdade deriva de categorias exaustivas, espera-se fechamento local sempre que a cobertura e os campos forem consistentes; fechamento local não transforma a identidade em teste de fraude.

## 5. Pesquisas

Cada pesquisa preserva instituto, campo, amostra, população, método, margem, indecisos, brancos/nulos e comparecimento declarado. Comparações só são feitas em denominadores compatíveis. Pesquisas não são combinadas sem um modelo explícito de ponderação, casas de pesquisa e tempo.

## 6. Modo preditivo e vazamento

A data de corte antecede o segundo turno. Fontes posteriores ou marcadas `result-second-round` são recusadas. O artefato de previsão é gravado antes da avaliação e recebe SHA-256 sobre representação canônica. Com várias eleições, a validação é temporal: todo treino precede o teste.

## 7. Fraude numérica

Este projeto não estima uma probabilidade de fraude a partir da identidade contábil porque tal parâmetro não é identificável. Para uma probabilidade posterior calibrada seriam necessários, no mínimo:

- taxa-base definida para o mecanismo de fraude investigado;
- dados rotulados confiáveis de eleições com e sem esse mecanismo;
- modelo causal que descreva como a fraude altera observáveis;
- validação fora da amostra e análise de falsos positivos;
- evidência independente, como auditorias de boletins, logs, recontagens ou cadeia de custódia.

Sem isso, pode-se calcular resíduos, controles de consistência e p-valores condicionais. Nenhum deles é `P(fraude | dados)`.

### Calculadora bayesiana condicional

A interface permite informar uma taxa-base `P(F)`, uma distribuição preditiva pré-eleitoral para a margem e uma distribuição do efeito numérico esperado sob fraude. Calcula-se `P(F|D)` por Bayes usando a razão entre as densidades da margem observada sob `F` e `não F`. A identidade contábil recebe peso zero porque é consequência algébrica. O resultado é rotulado como condicional às premissas e acompanhado de grade de sensibilidade; trocar a taxa-base ou o mecanismo pode alterar radicalmente a porcentagem.
