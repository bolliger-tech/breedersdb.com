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

cd backend
gcloud run deploy hasura \
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
```

