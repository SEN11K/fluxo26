# Fontes e proveniência

Consultadas em 26/10/2026 (horário de Brasília):

1. [Portal de Dados Abertos do TSE — Resultados 2026](https://dadosabertos.tse.jus.br/dataset/resultados-2026). Recursos usados: votação nominal por município/zona; detalhe da apuração por município/zona; votação presidencial por seção.
2. [EA20 nacional — 1º turno, eleição 6257](https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json).
3. [EA20 nacional — 2º turno, eleição 6258](https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json).
4. [Informações técnicas de divulgação 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados), que documenta ambiente oficial, códigos 6257/6258, formato EA20 e limites de acesso.
5. [Balanço oficial do 2º turno](https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/presidente-do-tse-anuncia-reeleicao-de-lula-e-faz-balanco-do-2o-turno-das-eleicoes-2026).
6. [Divisão regional do Brasil — IBGE](https://www.ibge.gov.br/geociencias/cartas-e-mapas/redes-geograficas/15778-divisoes-regionais-do-brasil.html), com Regiões Geográficas Imediatas e Intermediárias de 2017.
7. API oficial de Localidades do IBGE: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`.

O arquivo `data/polls-national-2026.json` registra instituto, registro eleitoral, campo, amostra, método, margem de erro, resultados e URL consultada. A regra de seleção é a última pesquisa nacional pós-primeiro-turno de cada instituto publicada até 24/10/2026. O site lê essa entrada auditável automaticamente e não depende de API privada ou paga. Resultados de pesquisas são intenção declarada, não votos observados.

O catálogo registra uma nota de cobertura: 39 registros ligados à transferência temporária permaneceram também nas seções de origem. Os arquivos indicam 158.745.502 registros de aptos; o quantitativo efetivo informado é 158.745.463. O programa preserva os valores originais, reporta a nota e não aplica correção oculta.

Cada download pelo CLI cria/atualiza `data/raw/manifest.json` com URL, instante de obtenção, nome, tamanho e SHA-256. Arquivos originais nunca são sobrescritos pelo processamento.

## Situação por seção em 26/10/2026

O recurso oficial “Presidente — Votação por seção eleitoral — 2026” foi baixado e preservado com SHA-256 `2d42006d0f6c6e00bad83f5c23cd3d78cd3e3182dbc1ad6718222b6b132c23e1`. O CSV interno informa geração em 06/10/2026 e contém o 1º turno (eleição 6257) na amostra de esquema inspecionada. Como o arquivo comparável do 2º turno ainda não estava presente nesse recurso, o programa bloqueou a conclusão seccional. O adaptador `--granularity=section` está pronto para nova execução quando os dois turnos forem publicados com cobertura compatível.
