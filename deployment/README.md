# Google Cloud Deployment

## Set envs

```bash
cat README.md | grep -E '^export ' > env.sh
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
  --enable-google-private-path \
  --network=projects/$PROJECT_ID/global/networks/default \
  --availability-type=ZONAL \
  --deletion-protection \
  --edition=ENTERPRISE \
  --insights-config-query-insights-enabled \
  --root-password=$PG_ROOT_PASSWORD

## NOTE
# Note: The db-f1-micro and db-g1-small machine types aren't included in the Cloud SQL SLA.
# These machine types are configured to use a shared-core CPU, and are designed to provide
# low-cost test and development instances only. Don't use them for production instances.

gcloud sql instances describe $PG_INSTANCE_NAME
# use connectionName to build connection string
# the DATABASE_NAME you get after creating the customer database
# postgres://postgres:<PASSWORD>@/<DATABASE_NAME>?host=/cloudsql/<CONNECTION_NAME>
```

### Access the database:

```bash
## FUTURE
# in the future use the following command to connect to the database
# currently there are some ipv6 issues…
gcloud components install cloud_sql_proxy
gcloud sql connect $PG_INSTANCE_NAME --user=postgres


## NOW
# NOTE: the instance needs a public IP to connect to it
# 1. install cloud-sql-proxy
brew install cloud-sql-proxy
# 2. start the proxy
cloud-sql-proxy $PROJECT_ID:$REGION:$PG_INSTANCE_NAME --port 35432 --gcloud-auth
# 3. connect to the database
psql -h localhost -p 35432 -U postgres [postgres / $PG_DB_NAME]
# check the env for the password
```

### Create customer database

```bash
export PG_DB_NAME=$INSTANCE

# start cloud-sql-proxy then:

psql -h localhost -p 35432 -U postgres <<EOF
create database $PG_DB_NAME locale_provider "icu" icu_locale "en_US-u-kn-true" template template0;
EOF
```

Links about collations:

- https://www.postgresql.org/docs/current/collation.html
- https://www.postgresql.org/docs/14/collation.html#COLLATION-CREATE
- https://blog.testdouble.com/posts/2022-12-12-pg-natural-sorting/
- https://github.com/unicode-org/cldr/blob/main/common/bcp47/collation.xml#L12

### Backups

Taking a backup:

```bash
pg_dump -h localhost -p 35432 -U postgres postgres --clean > $PG_INSTANCE_NAME-$PG_DB_NAME-$(date +"%Y.%m.%d_%H:%M:%S").sql
```

Restoring a backup:

```bash
psql -h localhost -p 35432 -U postgres $PG_DB_NAME < $PG_INSTANCE_NAME-$PG_DB_NAME-date.sql
```

You may need to reload the metadata in hasura after restoring the database.

## HASURA

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# use default service account
export RUN_SERVICE_ACCOUNT=$(gcloud iam service-accounts list | grep "Default compute" | awk '{print $5}')

export HASURA_VERSION=v2.40.2

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
  --memory=512Mi \
  --port=8080 \
  --region=$REGION \
  --network=default \
  --use-http2

hasura deploy --endpoint https://beta.breedersdb.com/api/hasura --admin-secret SECRET
# in case of error, try:
#hasura deploy --endpoint https://hasura-fbygdhvnga-oa.a.run.app --admin-secret SECRET

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

remove networking:

```bash
gcloud compute backend-services delete $HASURA_BACKEND_SERVICE_NAME \
  --global
gcloud compute network-endpoint-groups delete $HASURA_NEG_NAME \
  --region=$REGION
```

## FUNCTION

1. Prepare ENVs:
   > Extracted from the [`gcloud functions deploy`](https://cloud.google.com/sdk/gcloud/reference/functions/deploy#--env-vars-file) docs:
   >
   > `--env-vars-file=FILE_PATH`
   >
   > Path to a local YAML file with definitions for all environment variables. All existing environment variables will be removed before the new environment variables are added.

Copy `.env` to `env.yaml`, replace `=` with `: `, make bools to strings and adapt the values for prod.

1. Deploy:

```bash
cd cloud-function
export FN_SERVICE_NAME=${INSTANCE}-func
gcloud functions deploy ${FN_SERVICE_NAME} \
  --env-vars-file .env.yaml \
  --gen2 \
  --region=$REGION \
  --runtime=nodejs20 \
  --source=./ \
  --entry-point=func \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512M \
  --max-instances=5 \
  --concurrency=5
```

Note: `max-instance` and `concurrency` are set to establish some kind of bottleneck. Due to the cloud-function not being able to use database transactions this ensures that not an unlimited amount of SignIn attempts can be made concurrently. It also protects against accidental or intentional DDoS attacks causing high costs.

todo: check hasura timeout limits

### FUNCTION NETWORKING

```bash
export FN_NEG_NAME=${FN_SERVICE_NAME}-neg
export FN_BACKEND_SERVICE_NAME=${FN_SERVICE_NAME}-backend-service
export FN_BACKEND_SERVICE_CDN_NAME=${FN_SERVICE_NAME}-backend-service-cdn

gcloud compute network-endpoint-groups create $FN_NEG_NAME \
  --region=$REGION \
  --network-endpoint-type=serverless  \
  --cloud-run-service=$FN_SERVICE_NAME

# create backend-service
# must be global (transitive dependency of the load balancer's SSL feature)
gcloud compute backend-services create $FN_BACKEND_SERVICE_NAME \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# connect backend-service to network-endpoint-group
# must be global (transitive dependency of the load balancer's SSL feature)
gcloud compute backend-services add-backend $FN_BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group=$FN_NEG_NAME \
  --network-endpoint-group-region=$REGION


# create backend-service with cdn
gcloud compute backend-services create $FN_BACKEND_SERVICE_CDN_NAME \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --enable-cdn \
  --cache-mode=USE_ORIGIN_HEADERS \
  --custom-response-header='Cache-Status: {cdn_cache_status}' \
  --custom-response-header='Cache-ID: {cdn_cache_id}'

# connect backend-service to network-endpoint-group
gcloud compute backend-services add-backend $FN_BACKEND_SERVICE_CDN_NAME \
  --global \
  --network-endpoint-group=$FN_NEG_NAME \
  --network-endpoint-group-region=$REGION
```

remove networking:

```bash
gcloud compute backend-services delete $FN_BACKEND_SERVICE_NAME \
  --global
gcloud compute network-endpoint-groups delete $FN_NEG_NAME \
  --region=$REGION
```

## Frontend

### Bucket

```bash
export FE_BUCKET_NAME=${INSTANCE}-breedersdb-fe

# create bucket
gcloud storage buckets create gs://$FE_BUCKET_NAME \
  --location=$REGION \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --project=$PROJECT_ID

# make the bucket public
# Important: When objects are served from a public Cloud Storage bucket, by default they have a Cache-Control: public, max-age=3600 response header applied. This allows the objects to be cached when Cloud CDN is enabled.
gcloud storage buckets add-iam-policy-binding gs://$FE_BUCKET_NAME \
  --member=allUsers --role=roles/storage.objectViewer

# set the bucket as a website
gcloud storage buckets update gs://$FE_BUCKET_NAME \
  --web-main-page-suffix=index.html
  # --web-error-page=404.html

# create backend bucket
export FE_BUCKET_BACKEND=${FE_BUCKET_NAME}-backend
gcloud compute backend-buckets create $FE_BUCKET_BACKEND \
    --gcs-bucket-name=$FE_BUCKET_NAME \
    --enable-cdn \
    --cache-mode=USE_ORIGIN_HEADERS
```

### Deploy

First time: `cp .env.dev .env.prod`

```bash
cd frontend
yarn run build
gsutil -m rsync -d -R dist/spa/ gs://$FE_BUCKET_NAME

gcloud compute url-maps invalidate-cdn-cache $URL_MAP_NAME --path "/*"
# purge cache
# https://cloud.google.com/cdn/docs/invalidating-cached-content#invalidate_everything
```

## Load Balancer

```bash
# https://cloud.google.com/load-balancing/docs/https/setup-global-ext-https-serverless

# reserve static ipv4
export IPV4_NAME=load-balancer-ip
gcloud compute addresses create $IPV4_NAME \
  --network-tier=PREMIUM \
  --ip-version=IPV4 \
  --global

# get the ip (optional)
gcloud compute addresses describe $IPV4_NAME \
  --format="get(address)" \
  --global

# reserve static ipv6
export IPV6_NAME=load-balancer-ipv6
gcloud compute addresses create $IPV6_NAME \
  --network-tier=PREMIUM \
  --ip-version=IPV6 \
  --global

# point the domain to the ips (currently at cyon)

# create ssl certificate
export CERTIFICATE_NAME=${INSTANCE}-cert
gcloud compute ssl-certificates create $CERTIFICATE_NAME \
  --domains=${INSTANCE}.breedersdb.com \
  --global

# check certificate status (optional)
gcloud compute ssl-certificates describe $CERTIFICATE_NAME \
  --global \
  --format="get(name,managed.status, managed.domainStatus)"

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

# create url-map with path matchers
# https://cloud.google.com/load-balancing/docs/url-map-concepts
# https://cloud.google.com/compute/docs/reference/rest/v1/urlMaps
export URL_MAP_NAME=${INSTANCE}-url-map
export PATH_MATCHER_NAME=${INSTANCE}-path-matcher
echo "defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendBuckets/$FE_BUCKET_BACKEND
hostRules:
- hosts:
  - beta.breedersdb.com
  pathMatcher: $PATH_MATCHER_NAME
kind: compute#urlMap
name: $URL_MAP_NAME
pathMatchers:
- defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendBuckets/$FE_BUCKET_BACKEND
  name: $PATH_MATCHER_NAME
  routeRules:
  - description: forward request to hasura
    matchRules:
    - prefixMatch: /api/hasura/
    priority: 10
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$HASURA_BACKEND_SERVICE_NAME
  - description: redirect /api to /api/console
    matchRules:
    - fullPathMatch: /api/hasura
    priority: 11
    urlRedirect:
      pathRedirect: /api/hasura/console
      redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  - description: forward request to cloud-function
    matchRules:
    - prefixMatch: /api/internal/
    priority: 20
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$FN_BACKEND_SERVICE_NAME
  - description: forward request to cloud-function through CDN
    matchRules:
    - prefixMatch: /api/assets/
    priority: 21
    routeAction:
      urlRewrite:
        pathPrefixRewrite: /
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/$FN_BACKEND_SERVICE_CDN_NAME" | \
gcloud compute url-maps import $URL_MAP_NAME \
  --global

# create target-http-proxy & target-https-proxy
export TARGET_HTTP_PROXY_NAME=http-proxy
gcloud compute target-http-proxies create $TARGET_HTTP_PROXY_NAME \
  --url-map=$HTTPS_REDIRECT_URL_MAP_NAME

export TARGET_HTTPS_PROXY_NAME=${INSTANCE}-https-proxy
gcloud compute target-https-proxies create $TARGET_HTTPS_PROXY_NAME \
  --ssl-certificates=$CERTIFICATE_NAME \
  --url-map=$URL_MAP_NAME

# create forwarding-rules
export HTTP_FORWARDING_RULE_V4_NAME=http-forwarding-rule-v4
gcloud compute forwarding-rules create $HTTP_FORWARDING_RULE_V4_NAME \
  --address=$IPV4_NAME \
  --global \
  --target-http-proxy=$TARGET_HTTP_PROXY_NAME \
  --ports=80 \
  --load-balancing-scheme=EXTERNAL_MANAGED

export HTTP_FORWARDING_RULE_V6_NAME=http-forwarding-rule-v6
gcloud compute forwarding-rules create $HTTP_FORWARDING_RULE_V6_NAME \
  --address=$IPV6_NAME \
  --global \
  --target-http-proxy=$TARGET_HTTP_PROXY_NAME \
  --ports=80 \
  --load-balancing-scheme=EXTERNAL_MANAGED

export HTTPS_FORWARDING_RULE_V4_NAME=${INSTANCE}-https-forwarding-rule-v4
gcloud compute forwarding-rules create $HTTPS_FORWARDING_RULE_V4_NAME \
  --address=$IPV4_NAME \
  --global \
  --target-https-proxy=$TARGET_HTTPS_PROXY_NAME \
  --ports=443 \
  --load-balancing-scheme=EXTERNAL_MANAGED

export HTTPS_FORWARDING_RULE_V6_NAME=${INSTANCE}-https-forwarding-rule-v6
gcloud compute forwarding-rules create $HTTPS_FORWARDING_RULE_V6_NAME \
  --address=$IPV6_NAME \
  --global \
  --target-https-proxy=$TARGET_HTTPS_PROXY_NAME \
  --ports=443 \
  --load-balancing-scheme=EXTERNAL_MANAGED
```

remove url map:

```bash
gcloud compute forwarding-rules delete $HTTPS_FORWARDING_RULE_V6_NAME --global
gcloud compute forwarding-rules delete $HTTPS_FORWARDING_RULE_V4_NAME --global
gcloud compute forwarding-rules delete $HTTP_FORWARDING_RULE_V6_NAME --global
gcloud compute forwarding-rules delete $HTTP_FORWARDING_RULE_V4_NAME --global

gcloud compute target-https-proxies delete $TARGET_HTTPS_PROXY_NAME
gcloud compute target-http-proxies delete $TARGET_HTTP_PROXY_NAME

gcloud compute url-maps delete $URL_MAP_NAME
```

## Assets

```bash
export INSTANCE=beta
export REGION=europe-west6
export PROJECT_ID=breedersdb
export ASSETS_BUCKET_NAME=${INSTANCE}-breedersdb-assets

gcloud services enable \
  storage-component.googleapis.com

gcloud storage buckets create gs://$ASSETS_BUCKET_NAME \
  --location=$REGION \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access \
  --project=$PROJECT_ID

# add service account
export ASSETS_SERVICE_ACCOUNT_NAME=${PROJECT_ID}-storage-serv-acc
gcloud iam service-accounts create $ASSETS_SERVICE_ACCOUNT_NAME \
    --display-name $ASSETS_SERVICE_ACCOUNT_NAME

export ASSETS_SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list | grep $ASSETS_SERVICE_ACCOUNT_NAME | awk '{print $2}')

gcloud iam service-accounts keys create ${ASSETS_SERVICE_ACCOUNT_NAME}-key.json \
    --iam-account=$ASSETS_SERVICE_ACCOUNT_EMAIL

# grant all permissions on all buckets of project
# gcloud projects add-iam-policy-binding $PPROJECT_ID \
#     --member="serviceAccount:${ASSETS_SERVICE_ACCOUNT_EMAIL}" \
#     --role="roles/storage.objectAdmin"

# grant write, overwrite, delete and read permissions
gsutil iam ch \
  "serviceAccount:${ASSETS_SERVICE_ACCOUNT_EMAIL}:roles/storage.objectUser" \
  gs://${ASSETS_BUCKET_NAME}

# list permissions
gsutil iam get gs://${ASSETS_BUCKET_NAME}
```

### Upload existing photos

Extract photos from subfolders:

```bash
find ./photos -type f -exec cp {} ./photos-flat/ \;
```

Upload photos:

```bash
gsutil -m rsync -R ./photos-flat/ gs://$ASSETS_BUCKET_NAME
```

Hint: use `-d` to delete files in the bucket that are not in the local folder.
