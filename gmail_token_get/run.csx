#r "System.Web.Extensions"
using System;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.ServiceBus.Messaging;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Gmail.v1;
using System.Threading;
using System.Security.Cryptography.X509Certificates;
using System.Web.Script.Serialization;

public static void Run(string myQueueItem, TraceWriter log)
{
    try
    {
        log.Info($"C# ServiceBus queue trigger function processed message: {myQueueItem}");
        string serviceAccountEmail = System.Environment.GetEnvironmentVariable("client_email", EnvironmentVariableTarget.Process);

        //Not sure why setting the flags to both works in this scenario, on local works when set to Exportable
        var certificate = new X509Certificate2(@"D:\\home\\site\\wwwroot\\ServiceBusQueueTriggerCSharp1\\IGOR-5c71679e6b18.p12", System.Environment.GetEnvironmentVariable("cert_pwd", EnvironmentVariableTarget.Process), X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.Exportable);
        log.Info($"Certificate: {certificate}");
        ServiceAccountCredential credential = new ServiceAccountCredential(
           new ServiceAccountCredential.Initializer(serviceAccountEmail)
           {
               User = "igor@wrdsb.ca",
               Scopes = new[] { GmailService.Scope.GmailSend }
           }.FromCertificate(certificate));
           log.Info($"Credential: {credential}");
        if (credential.RequestAccessTokenAsync(CancellationToken.None).Result)
        {
            //We now have our token for google service account
            var token = credential.Token.AccessToken;
            log.Info($"Token: {token}");

            //Send the token and the message to the Service Bus that gets processed by gmail_send function
            var connectionString = System.Environment.GetEnvironmentVariable("connection_string", EnvironmentVariableTarget.Process);
            var queueName = System.Environment.GetEnvironmentVariable("queue_name", EnvironmentVariableTarget.Process);

            var client = QueueClient.CreateFromConnectionString(connectionString, queueName);

            //Append our Token to the end of the input string
            var new_message = myQueueItem.Insert(myQueueItem.IndexOf("}"), ",\"access_token\": \"" + token + "\"");
            log.Info($"New message: {new_message}");
            var output_message = new BrokeredMessage(new_message);

            //Send the message to the gmail message queue
            client.Send(output_message);
        }
        else
        {
            //Something went wrong
            log.Info("Failed to get service token");
        }
    }
    catch(Exception ex)
    {
        //Something went really wrong
        log.Info($"Exception: {ex.StackTrace}");
    }
}
