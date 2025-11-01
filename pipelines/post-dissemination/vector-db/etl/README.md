## Workflow

### On new report
1. 
```
./reset_docker_postgres.sh
```

2. 
```
rm extracted_reports.json
```

```
rm transformed_reports.json
```


3. 
```
rm ../../../microservices/faiss-engine/data/transformed_reports.json
```

```
rm ../../../microservices/faiss-engine/data/faiss.idx
```

rm ../../../microservices/faiss-engine/data/vectors.npy
```

    - run etl pipelie
    - load into fiass
    - run embedding_and_indexing
    - adjsut query for new labels
    - adjust indexing for labels
    - test embedding_and_ with query
    - test faiss
    - ensure query result to mcp 