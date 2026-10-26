# Fluxo 26 — Analisador Reverso Eleitoral

Aplicação local em Node.js para auditar a contabilidade entre os turnos da eleição presidencial brasileira de 2026 e explorar **múltiplas matrizes de transição compatíveis** com os totais oficiais. O projeto não tenta reconstruir votos individuais a partir de agregados e não converte coincidências contábeis em alegações de fraude.

## Resultado nacional já conferido

Os arquivos nacionais EA20 do TSE confirmam:

```text
Aumento de Lula                  10.376.694
Aumento de Flávio Bolsonaro      3.721.538
Soma dos aumentos               14.098.232

Votos dos eliminados             9.316.747
Aumento líquido do comparecimento 2.960.239
Redução de brancos                 870.302
Redução de nulos                   950.944
Soma                            14.098.232
Resíduo                                  0
```

Isso é uma identidade de conservação de categorias, não uma amostra aleatória. Portanto, a exatidão tem probabilidade 1 quando os totais são internamente consistentes e não permite calcular `P(fraude | igualdade)`.

## Instalação no Windows / VS Code

1. Instale o [Node.js 20 LTS ou mais recente](https://nodejs.org/).
2. Abra esta pasta no VS Code.
3. Abra **Terminal → Novo Terminal**.
4. Execute:

```powershell
npm install
npm test
npm start
```

5. Abra `http://localhost:3000` no navegador.

Não são necessárias chaves de API nem serviços pagos.

O funcionamento principal é automático: a página **Modelo reverso** procura uma família de matrizes compatíveis, sem pedir probabilidades ao usuário. A página inicial carrega as pesquisas nacionais documentadas, combina incerteza amostral, heterogeneidade entre institutos e erro histórico e compara o resultado observado com a distribuição preditiva. Os controles manuais ficam recolhidos como auditoria avançada.

Como a taxa-base e um mecanismo causal específico de fraude não são observáveis nesses totais, o programa apresenta probabilidade de cauda, razão de verossimilhança e sensibilidade a taxas-base; ele não inventa uma porcentagem única de fraude.

## Obter todos os municípios

O analisador usa os dois recursos completos do catálogo oficial. Os arquivos brutos ficam intactos em `data/raw/`, acompanhados de URL, data de obtenção, tamanho e SHA-256 em `data/raw/manifest.json`.

```powershell
npm run download:tse -- --resource=detailMunicipalityZone
npm run download:tse -- --resource=candidateMunicipalityZone
```

Como os CSVs do catálogo podem ser atualizados em horários diferentes, a forma recomendada para uma fotografia municipal sincronizada é baixar os EA20 municipais documentados pelo TSE:

```powershell
npm run fetch:municipal
```

Esse comando obtém os dois turnos para todos os códigos do arquivo oficial de configuração municipal, preserva cada JSON em `data/raw/results-api/` e gera a análise final automaticamente.

Depois localize os CSVs extraídos e confira o esquema real:

```powershell
npm run profile -- --file="data\raw\detalhe_votacao_munzona_2026\detalhe_votacao_munzona_2026_BRASIL.csv"
```

O nome interno do CSV pode variar; use o nome efetivamente extraído. Em seguida:

```powershell
npm run analyze -- --detail="CAMINHO_DO_CSV_DETALHE_BRASIL" --candidates="CAMINHO_DA_PASTA_COM_CSVS_DE_CANDIDATOS"
npm start
```

O programa agrega zonas para município, cruza apenas chaves presentes nos dois turnos, inclui todas as UFs e preserva `ZZ` (exterior) como abrangência própria quando presente. Divergências de cobertura aparecem antes da análise.

## Regiões dentro dos estados

Execute `npm run regions` após a análise municipal. O comando cruza os códigos TSE com os códigos IBGE do arquivo oficial de configuração, baixa a classificação territorial do IBGE e produz:

- 510 Regiões Geográficas Imediatas;
- 133 Regiões Geográficas Intermediárias;
- mesorregiões legadas para nomes históricos amplamente usados;
- recortes declarados em `config/custom-regions.json`.

Os recortes destacados incluídos são Sul/Sudoeste de Minas, Zona da Mata de Minas e Norte/Noroeste de São Paulo. O último é explicitamente a união das mesorregiões São José do Rio Preto e Ribeirão Preto. A interface informa a base de cada recorte e permite exportar CSV.

Para seção eleitoral, use os recursos “Detalhe da apuração por seção eleitoral” e “Presidente — Votação por seção eleitoral” e acrescente `--granularity=section`. A saída fica em `data/processed/section-analysis.json`. A análise é bloqueada se os dois turnos não estiverem presentes ou se a cobertura for incompatível.

Na consulta de 26/10/2026, o arquivo presidencial por seção disponível no catálogo tinha geração em 06/10/2026 e dados do 1º turno. Por isso, nenhuma inferência seccional foi produzida; isso evita comparar universos incompatíveis.

## Importação manual

Se o download automático falhar:

1. Acesse o [conjunto oficial Resultados 2026](https://dadosabertos.tse.jus.br/dataset/resultados-2026).
2. Baixe “Detalhe da apuração por município e zona” e “Votação nominal por município e zona”.
3. Não edite os ZIPs; copie-os para `data/raw/` e extraia cópias em subpastas.
4. Use `npm run profile` para documentar os cabeçalhos.
5. Use `npm run analyze` com os caminhos reais.

Os adaptadores mapeiam somente cabeçalhos encontrados no arquivo. Campo obrigatório ausente interrompe ou sinaliza a análise; não há preenchimento silencioso.

## Modos de análise

- **Reverso:** usa os dois turnos e balanceamento biproporcional (IPF) para obter matrizes com margens exatamente iguais às observadas. Priors diferentes geram soluções diferentes, todas compatíveis.
- **Preditivo:** aceita apenas fontes com `availableAt` anterior ao corte. Qualquer resultado do segundo turno causa `DataLeakageError`. A previsão é registrada com parâmetros, versão, fontes e hash antes da avaliação.

## Pesquisas eleitorais

Use `data/polls-template.csv`. A primeira linha é explicitamente sintética e deve ser removida. O importador exige instituto, datas de campo, amostra, população-alvo e método. Comparecimento ausente permanece `desconhecido`; intenção de voto nunca é tratada como voto realizado.

## Saídas

- `data/processed/analysis.json`: análise completa nacional e municipal.
- Interface: totais, identidade, matriz, cenários, amplitudes, qualidade e tabela municipal.
- Exportação: JSON de cenários e CSV municipal pelo navegador.
- `data/predictions/`: compromissos preditivos com SHA-256.

## Testes

`npm test` cobre balanços, duplicatas, ausências, identidade, divergência nacional/municipal, soma das probabilidades, múltiplas soluções e prevenção de vazamento temporal.

## Limites científicos

O modelo resolve um problema de margens, não rastreia eleitores. A inferência ecológica não distingue, apenas com totais, quem mudou de candidato, quem se absteve ou quem passou a comparecer. Para distinguir trajetórias seriam necessários painéis individuais representativos e consentidos, pesquisas de recontato com comparecimento por grupo, microdados de fluxo vinculáveis sob proteção adequada ou desenho causal externo. Consulte [METODOLOGIA.md](METODOLOGIA.md).
