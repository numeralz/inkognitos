FROM ipfs/go-ipfs:latest

RUN echo "mkdir -p /export /data/ipfs && chown -R ipfs /export && chown -R ipfs /data/ipfs" > /__tmp.sh


VOLUME ["/export"]
VOLUME ["/data/ipfs"]

RUN ipfs init \
&&  ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \
      '["http://127.0.0.1:5002", \
      "http://127.0.0.1:3000", \
      "http://127.0.0.1:5001", \
      "https://webui.ipfs.io"]' \
&&  ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods \
      '["PUT", "POST"]'

CMD ["daemon"]