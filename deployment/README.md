# Google Cloud Deployment

## Set envs

```bash
. ./env.sh
```

## Create Project

This is untested!

```bash
# set permissions
# https://console.cloud.google.com/iam-admin/serviceaccounts?project=breedersdb&supportedpurview=project
# https://cloud.google.com/run/docs/reference/iam/roles#additional-configuration

export REGION=europe-west6
export PROJECT_ID=breedersdb
export INSTANCE=beta

# update gcloud cli
gcloud components update

# create and select project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# authenticate docker
gcloud auth configure-docker $REGION-docker.pkg.dev
```

## POSTGRES

```bash
# add yourself the "Cloud SQL-Admin" role
# https://console.cloud.google.com/iam-admin/iam?project=breedersdb

# add necessary services
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  iam.googleapis.com \
  servicenetworking.googleapis.com \
  run.googleapis.com \
  servicenetworking.googleapis.com \
  networkconnectivity.googleapis.com

# envs
export PG_INSTANCE_NAME=breedersdb-pg-staging
export PG_ROOT_PASSWORD=SECRET

# add service accont
gcloud iam service-accounts create $PG_INSTANCE_NAME-serv-acc

export PG_SERVICE_ACCOUNT=$(gcloud iam service-accounts list | grep $PG_INSTANCE_NAME-serv-acc | awk '{print $1}')

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$PG_SERVICE_ACCOUNT" --role="roles/cloudsql.client"

# more about private IP: https://cloud.google.com/sql/docs/postgres/configure-private-ip

export VPC_RANGE_NAME=internal-range

# create address range
# https://cloud.google.com/vpc/docs/configure-private-services-access#procedure
gcloud compute addresses create $VPC_RANGE_NAME \
    --global \
    --purpose=VPC_PEERING \
    --addresses=10.108.0.0 \
    --prefix-length=16 \
    --description="range for internal connections" \
    --network=default

# create vpc peering
# https://cloud.google.com/vpc/docs/configure-private-services-access#creating-connection
gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=$VPC_RANGE_NAME \
    --network=default

# create postgres instance
gcloud sql instances create $PG_INSTANCE_NAME \
  --database-version=POSTGRES_16 \
  --region=$REGION \
  --backup-start-time="00:00" \
  --backup-location=eu \
  --retained-backups-count=14 \
  --tier=db-f1-micro \
  --storage-size=10Gib \
  --storage-auto-increase \
  #--ssl-mode=TRUSTED_CLIENT_CERTIFICATE_REQUIRED \
  --ssl-mode=ALLOW_UNENCRYPTED_AND_ENCRYPTED \
  --activation-policy=ALWAYS \
  --no-assign-ip \
  --enable-google-private-path \
  --network=projects/$PROJECT_ID/global/networks/default \
  --availability-type=ZONAL \
  --deletion-protection \
  --edition=ENTERPRISE \
  --insights-config-query-insights-enabled \
  --root-password=$PG_ROOT_PASSWORD

gcloud sql instances describe $PG_INSTANCE_NAME
# use connectionName to build connection string
# postgres://postgres:<PASSWORD>@/<DATABASE_NAME>?host=/cloudsql/<CONNECTION_NAME>

# TODO: cloud proxy
```

## HASURA

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# use default service account
export RUN_SERVICE_ACCOUNT=$(gcloud iam service-accounts list | grep "Default compute" | awk '{print $5}')

export HASURA_VERSION=v2.40.0

export HASURA_SERVICE_NAME=${INSTANCE}-hasura
export HASURA_NEG_NAME=${HASURA_SERVICE_NAME}-neg
export HASURA_BACKEND_SERVICE_NAME=${HASURA_SERVICE_NAME}-backend-service

cd backend
gcloud run deploy $HASURA_SERVICE_NAME \
  --image=hasura/graphql-engine:$HASURA_VERSION \
  --add-cloudsql-instances "$PROJECT_ID:$REGION:$PG_INSTANCE_NAME" \
  --service-account=$RUN_SERVICE_ACCOUNT \
  --env-vars-file=.env.yaml \
  --allow-unauthenticated \
  --max-instances=2 \
  --min-instances=1 \
  --cpu=1 \
  --memory=1024Mi \
  --port=8080 \
  --region=$REGION \
  --use-http2

hasura deploy --endpoint https://hasura-fbygdhvnga-oa.a.run.app --admin-secret SECRET

# hasura should now be available on the https://hasura-fbygdhvnga-oa.a.run.app
# the following steps are preparations for the load balancer for using it with a
# custom domain.

# create serverless network-endpoint-group (NEG)
gcloud compute network-endpoint-groups create $HASURA_NEG_NAME \
  --region=$REGION \
  --network-endpoint-type=serverless  \
  --cloud-run-service=$HASURA_SERVICE_NAME

# create backend-service
gcloud compute backend-services create $HASURA_BACKEND_SERVICE_NAME \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# connect backend-service to network-endpoint-group
gcloud compute backend-services add-backend $HASURA_BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group=$HASURA_NEG_NAME \
  --network-endpoint-group-region=$REGION
```

## AUTH

```bash
export AUTH_SERVICE_NAME=${INSTANCE}-auth
export AUTH_NEG_NAME=${AUTH_SERVICE_NAME}-neg
export AUTH_BACKEND_SERVICE_NAME=${AUTH_SERVICE_NAME}-backend-service

# TODO: create auth service

gcloud compute network-endpoint-groups create $AUTH_NEG_NAME \
  --region=$REGION \
  --network-endpoint-type=serverless  \
  --cloud-run-service=$AUTH_SERVICE_NAME

# create backend-service
# must be global (transitive dependency of the load balancer's SSL feature)
gcloud compute backend-services create $AUTH_BACKEND_SERVICE_NAME \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# connect backend-service to network-endpoint-group
# must be global (transitive dependency of the load balancer's SSL feature)
gcloud compute backend-services add-backend $AUTH_BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group=$AUTH_NEG_NAME \
  --network-endpoint-group-region=$REGION
```

## Load Balancer

```bash
# https://cloud.google.com/load-balancing/docs/https/setup-global-ext-https-serverless

# reserve static ip
export IP_NAME=load-balancer-ip
gcloud compute addresses create $IP_NAME \
  --network-tier=PREMIUM \
  --ip-version=IPV4 \
  --global

# get the ip (optional)
gcloud compute addresses describe $IP_NAME \
  --format="get(address)" \
  --global

# point the domain to the ip (currently at cyon)

# create ssl certificate
export CERTIFICATE_NAME=${INSTANCE}-cert
gcloud compute ssl-certificates create $CERTIFICATE_NAME \
  --domains=${INSTANCE}.breedersdb.com \
  --global

# check certificate status (optional)
gcloud compute ssl-certificates describe $CERTIFICATE_NAME \
  --global \
  --format="get(name,managed.status, managed.domainStatus)"

# create url-map with path matchers
# https://cloud.google.com/load-balancing/docs/url-map-concepts
# https://cloud.google.com/compute/docs/reference/rest/v1/urlMaps
# TODO: change default-service to frontend as soon as it is ready
export URL_MAP_NAME=${INSTANCE}-url-map
export PATH_MATCHER_NAME=${INSTANCE}-path-matcher
echo "defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$AUTH_BACKEND_SERVICE_NAME
hostRules:
- hosts:
  - beta.breedersdb.com
  pathMatcher: $PATH_MATCHER_NAME
kind: compute#urlMap
name: $URL_MAP_NAME
pathMatchers:
- defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$AUTH_BACKEND_SERVICE_NAME
  name: $PATH_MATCHER_NAME
  routeRules:
  - description: forward request to hasura without the /api/v1/ prefix
    matchRules:
    - prefixMatch: /api/v1/
    priority: 10
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$HASURA_BACKEND_SERVICE_NAME
  - description: redirect /api/v1 to /api/v1/
    matchRules:
    - fullPathMatch: /api/v1
    priority: 11
    urlRedirect:
      pathRedirect: /api/v1/
      redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  - description: forward request to auth without the /auth/v1/ prefix
    matchRules:
    - prefixMatch: /auth/v1/
    priority: 20
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$AUTH_BACKEND_SERVICE_NAME
  - description: redirect /auth/v1 to /auth/v1/
    matchRules:
    - fullPathMatch: /auth/v1
    priority: 21
    urlRedirect:
      pathRedirect: /auth/v1/
      redirectResponseCode: MOVED_PERMANENTLY_DEFAULT" | \
gcloud compute url-maps import $URL_MAP_NAME \
  --global

# create url-map with https redirect
export HTTPS_REDIRECT_URL_MAP_NAME=https-redirect-url-map
export HTTPS_REDIRECT_PATH_MATCHER_NAME=https-redirect-path-matcher
echo "kind: compute#urlMap
name: $HTTPS_REDIRECT_URL_MAP_NAME
defaultUrlRedirect:
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  httpsRedirect: True" | \
gcloud compute url-maps import $HTTPS_REDIRECT_URL_MAP_NAME \
  --global

# create target-http-proxy & target-https-proxy
export TARGET_HTTP_PROXY_NAME=http-proxy
gcloud compute target-http-proxies create $TARGET_HTTP_PROXY_NAME \
  --url-map=$HTTPS_REDIRECT_URL_MAP_NAME

export TARGET_HTTPS_PROXY_NAME=${INSTANCE}-https-proxy
gcloud compute target-https-proxies create $TARGET_HTTPS_PROXY_NAME \
  --ssl-certificates=$CERTIFICATE_NAME \
  --url-map=$URL_MAP_NAME

# create forwarding-rule
export HTTP_FORWARDING_RULE_NAME=http-forwarding-rule
gcloud compute forwarding-rules create $HTTP_FORWARDING_RULE_NAME \
  --address=$IP_NAME \
  --global \
  --target-http-proxy=$TARGET_HTTP_PROXY_NAME \
  --ports=80 \
  --load-balancing-scheme=EXTERNAL_MANAGED

export HTTPS_FORWARDING_RULE_NAME=${INSTANCE}-https-forwarding-rule
gcloud compute forwarding-rules create $HTTPS_FORWARDING_RULE_NAME \
  --address=$IP_NAME \
  --global \
  --target-https-proxy=$TARGET_HTTPS_PROXY_NAME \
  --ports=443 \
  --load-balancing-scheme=EXTERNAL_MANAGED
```
