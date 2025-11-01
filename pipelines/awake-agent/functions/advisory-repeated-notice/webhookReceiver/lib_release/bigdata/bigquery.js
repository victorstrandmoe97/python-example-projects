import { BigQuery } from '@google-cloud/bigquery';
import process from 'process';

const bigquery = new BigQuery();
const dataset = 'security_stories';

export async function initializeDatabase() {
  try {
    await bigquery.dataset(dataset).get();
    console.log('✓ BigQuery connection established');
  } catch (error) {
    console.error('Error connecting to BigQuery:', error);
    throw error;
  }
}

export async function getEmailReferencesForDateRange(startDate, endDate) {
  const query = `
    SELECT title, sender, email_id, date_received
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.email_references\`
    WHERE DATE(date_received) BETWEEN @startDate AND @endDate
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { startDate, endDate }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching email references:', error);
    throw error;
  }
}


export async function getStoryReferencesForEmails(emailIds) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_references\`
    WHERE email_id IN UNNEST(@emailIds)
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { emailIds }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching story references:', error);
    throw error;
  }
}

export async function insertEmailRef(emailRef) {
  const rows = [{
    email_id: emailRef.email_id,
    date_received: emailRef.date_received,
    title: emailRef.title,
    sender: emailRef.sender
  }];

  try {
    await bigquery
      .dataset(dataset)
      .table('email_references')
      .insert(rows);
    console.log('✓ Email reference inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting email reference:', error);
    throw error;
  }
}
export async function insertNewThreatDigestSubscription(customeRef) {
  const rows = [{
    customer_id: customeRef.customer_id,
    product_id: customeRef.product_id,
    email_address: customeRef.email_address,
    include_government: customeRef.include_government,
    include_regulatory: customeRef.include_regulatory,
    topics_of_interest: customeRef.topics_of_interest,
    date_created: new Date()
  }];

  try {
    await bigquery
      .dataset("sales")
      .table('threat_digest_customer_configs')
      .insert(rows);
    console.log('✓ Email reference inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting email reference:', error);
    throw error;
  }
}

export async function insertStoryRefs(stories) {
  const storyReferences = stories.map(story => ({
    story_id: story.story_id,
    email_id: story.email_id,
    date_reported: story.date_reported,
    date_collected: story.date_collected
  }));

  const storyLabels = stories.map(story => ({
    story_id: story.story_id,
    headline: story.headline,
    technologies: story.technologies,
    industries: story.industries,
    affiliated_organizations: story.affiliated_organizations,
    financial_impact_usd: story.financial_impact_usd,
    hint_action: story.hint_action,
    action_text: story.action_text
  }));

  try {
    await bigquery
      .dataset(dataset)
      .table('story_references')
      .insert(storyReferences);
    console.log(`✓ ${storyReferences.length} story references inserted`);
  } catch (error) {
    console.error('Error inserting story references:', error);
    throw error;
  }

  try {
    await bigquery
      .dataset(dataset)
      .table('story_labels')
      .insert(storyLabels);
    console.log(`✓ ${storyLabels.length} story labels inserted`);
  } catch (error) {
    console.error('Error inserting story labels:', error);
    throw error;
  }
}


export async function getClustersFromTrendTable(trendTableName, startDate, endDate) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.${trendTableName}\`
    WHERE date_start <= @date_end AND date_end >= @date_start
  `;


  try {
    const [rows] = await bigquery.query({
      query,
      params: { date_start: startDate, date_end: endDate }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching story clusters:', error);
    throw error;
  }
}


export async function getStoriesFromCluster(clusterId, clusterTableName, dateStart, dateEnd) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.${clusterTableName}\`
    WHERE cluster_id = @clusterId
      AND date_start <= @dateEnd
      AND date_end >= @dateStart
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { clusterId, dateStart, dateEnd }
    });

    if (rows.length === 0) {
      console.log(`No stories found for cluster ID: ${clusterId}`);
      return [];
    }

    const storyIds = rows.flatMap(row => row.story_refs.map(ref => ref.story_id));
    const labels = await getStoryLabels(storyIds);

    const stories = rows.flatMap(row =>
      row.story_refs.map(ref => {
        const label = labels.find(lbl => lbl.story_id === ref.story_id) || {};
        return {
          story_id: ref.story_id,
          email_id: ref.email_id,
          date_reported: ref.date_reported,
          date_collected: ref.date_collected,
          headline: label.headline || '',
          technologies: label.technologies || [],
          industries: label.industries || [],
          affiliated_organizations: label.affiliated_organizations || [],
          financial_impact_usd: label.financial_impact_usd || 0,
          hint_action: label.hint_action || false,
          action_text: label.action_text || null
        };
      })
    );

    return stories;
  } catch (error) {
    console.error('Error fetching stories from cluster:', error);
    throw error;
  }
}

export async function getStoryLabels(storyIds) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_labels\`
    WHERE story_id IN UNNEST(@storyIds)
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { storyIds }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching story labels:', error);
    throw error;
  }
}

export async function getWeeklyOperativesNewsletterSubscribers() {
  const query = `
    SELECT 
      subs.user_id,
      subs.frameworks,
      subs.companies,
      subs.role,
      refs.email_address,
      refs.first_name,
      refs.last_name,
      refs.date_updated AS user_date_updated,
      refs.date_created AS user_date_created
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.subscriptions_weekly_operatives_newsletter\` subs
    LEFT JOIN \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.threat_digest_customer_configs\` refs
    ON subs.user_id = refs.customer_id
    WHERE subs.active_subscription = true
  `;

  try {
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching weekly operatives newsletter subscribers:', error);
    throw error;
  }
}

export async function insertWeeklyNewsletterForOperatives(newsletter) 
{
  const rows = [{
    report_id: newsletter.report_id,
    week: newsletter.week,
    year: newsletter.year,
    directives: newsletter.directives,
    trends: newsletter.trends,
  }];

  try {
    // Query the table to check for existing newsletters for the same week and year
    const query = `
      SELECT report_id
      FROM \`${dataset}.weekly_newsletter_for_operatives\`
      WHERE week = @week AND year = @year
      LIMIT 1
    `;
    const options = {
      query,
      params: {
        week: newsletter.week,
        year: newsletter.year,
      },
    };

    const [job] = await bigquery.createQueryJob(options);
    const [results] = await job.getQueryResults();

    if (results.length > 0) {
      throw new Error(`Newsletter for week ${newsletter.week} of year ${newsletter.year} already exists.`);
    }

    // Proceed to insert if no duplicates are found
    await bigquery
      .dataset(dataset)
      .table('weekly_newsletter_for_operatives')
      .insert(rows);

    console.log('✓ Newsletter successfully inserted into weekly_newsletter_for_operatives');
    return rows[0];
  } catch (error) {
    console.error('Error inserting newsletter into weekly_newsletter_for_operatives:', error);
    throw error;
  }
}

export async function insertWeeklyNewsletterForDecisionMakers(newsletter) {

  const rows = [{
    report_id: newsletter.report_id,
    week: newsletter.week,
    year: newsletter.year,
    directives: newsletter.directives,
    trends: newsletter.trends
  }];

  try {
    // Query the table to check for existing newsletters for the same week and year
    const query = `
      SELECT report_id
      FROM \`${dataset}.weekly_newsletter_for_decisionmakers\`
      WHERE week = @week AND year = @year
      LIMIT 1
    `;
    const options = {
      query,
      params: {
        week: newsletter.week,
        year: newsletter.year,
      },
    };

    const [job] = await bigquery.createQueryJob(options);
    const [results] = await job.getQueryResults();

    if (results.length > 0) {
      throw new Error(`Newsletter for week ${newsletter.week} of year ${newsletter.year} already exists.`);
    }

    // Proceed to insert if no duplicates are found
    await bigquery
      .dataset(dataset)
      .table('weekly_newsletter_for_decisionmakers')
      .insert(rows);

    console.log('✓ Newsletter successfully inserted into weekly_newsletter_for_decisionmakers');
    return rows[0];
  } catch (error) {
    console.error('Error inserting newsletter into weekly_newsletter_for_decisionmakers:', error);
    throw error;
  }
}


export async function insertWeeklyNewsletter(newsletter, type) {
  if (type === 'operatives') {
    return insertWeeklyNewsletterForOperatives(newsletter);
  } else if (type === 'decision-makers') {
    return insertWeeklyNewsletterForDecisionMakers(newsletter);
  } else {
    throw new Error(`Invalid newsletter type: ${type}`);
  }
}

export async function getWeeklyNewsletterForOperatives(week, year) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.weekly_newsletter_for_operatives\`
    WHERE week = @week AND year = @year
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { week, year }
    });
    return rows[0];
  } catch (error) {
    console.error('Error fetching newsletter for operatives:', error);
    throw error;
  }
}
export async function getWeeklyOperativesNewsletterSubscriber(email) {
  try {
    const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.subscriptions_weekly_operatives_newsletter\`
    WHERE email_address = @email
  `;

    const [rows] = await bigquery.query({
      query,
      params: { email }
    });

    const user = rows[0];
    if (!user || !user.user_id) {
      console.log('No user found with email:', email);
      return null;
    }

    const [subscriber] = await bigquery
      .dataset("sales")
      .table('subscriptions_weekly_operatives_newsletter')
      .query({
        query: `
          SELECT *
          FROM \`sales.subscriptions_weekly_operatives_newsletter\`
          WHERE user_id = @user_id AND active_subscription = true
        `,
        params: { user_id: user.user_id }
      });

      if(!subscriber || !subscriber[0]) {
        console.log('No subscriber found with user_id:', user.user_id);
        return null;
      }

      return {
        ...subscriber[0],
        ...user
      };

  }catch (error) {
    console.error('Error fetching weekly operatives newsletter subscriber:', error);
    throw error;
  }
}


// Insert Weekly Operatives Newsletter Subscriber with validation
export async function insertWeeklyOperativesNewsletterSubscriber(subscriber) {
  try {
    const existingSubscriber = await getWeeklyOperativesNewsletterSubscriber(subscriber.email_address);
    
    if (existingSubscriber) {
      console.log(`Subscriber with email ${subscriber.email_address} already exists in operatives newsletter.`);
      return;
    }

    console.log(`Inserting weekly operatives newsletter subscriber:`, subscriber);

    const rows = [{
      subscription_id: subscriber.subscription_id,
      user_id: subscriber.user_id,
      frameworks: subscriber.frameworks,
      platforms: subscriber.platforms,
      companies: subscriber.companies,
      date_created: subscriber.date_created,
      date_updated: subscriber.date_updated,
      paying_subscription: subscriber.paying_subscription,
      active_subscription: subscriber.active_subscription,
    }];

    await bigquery
      .dataset("sales")
      .table('subscriptions_weekly_operatives_newsletter')
      .insert(rows);
    console.log('✓ Weekly operatives newsletter subscriber inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting weekly operatives newsletter subscriber:', error);
    error.errors.map((error) => {
      console.error(`  Details: ${JSON.stringify(error, null, 2)}`);
    });
    throw error;
  }
}

// Insert Weekly Decision Maker Newsletter Subscriber with validation
export async function insertWeeklyDecisionMakerNewsletterSubscriber(subscriber) {
  try {
    const existingSubscriber = await getWeeklyDecisionMakerNewsletterSubscriber(subscriber.email_address);
    
    if (existingSubscriber) {
      console.log(`Subscriber with email ${subscriber.email_address} already exists in decision maker newsletter.`);
      return;
    }

    const rows = [{
      subscription_id: subscriber.subscription_id,
      user_id: subscriber.user_id,
      frameworks: subscriber.frameworks,
      platforms: subscriber.platforms,
      companies: subscriber.companies,
      date_created: subscriber.date_created,
      date_updated: subscriber.date_updated,
      paying_subscription: subscriber.paying_subscription,
      active_subscription: subscriber.active_subscription,
    }];

    await bigquery
      .dataset(dataset)
      .table('subscriptions_weekly_decisionmakers_newsletter')
      .insert(rows);
    console.log('✓ Weekly decision maker newsletter subscriber inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting weekly decision maker newsletter subscriber:', error);
    throw error;
  }
}


export async function getWeeklyDecisionMakerNewsletterSubscriber(email) {
  try {
    const query = `
    SELECT user_id
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.sast_customer_config\`
    WHERE email_address = @email
  `;

    const [rows] = await bigquery.query({
      query,
      params: { email }
    });

    const user_id = rows[0]?.user_id;
    if (!user_id) {
      console.log('No user found with email:', email);
      return null;
    }

    const [subscriber] = await bigquery
      .dataset(dataset)
      .table('subscriptions_weekly_decisionmakers_newsletter')
      .query({
        query: `
          SELECT *
          FROM \`${dataset}.subscriptions_weekly_decisionmakers_newsletter\`
          WHERE user_id = @user_id AND active_subscription = true
        `,
        params: { user_id }
      });
    return subscriber[0];

  }catch (error) {
    console.error('Error fetching weekly decisionmaker newsletter subscriber:', error);
    throw error;
  }
}

export async function writeBufferedSubscriptionDataToBigQuery(rows, tableId) {
  const query = `
    MERGE INTO \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.${tableId}\` AS target
    USING UNNEST(@rows) AS source
    ON target.user_id = source.user_id
    WHEN MATCHED THEN
      UPDATE SET
        target.active_subscription = source.active_subscription,
        target.paying_subscription = source.paying_subscription,
        target.date_updated = source.date_updated,
    WHEN NOT MATCHED THEN
      INSERT (paying_subscription, active_subscription)
      VALUES (source.paying_subscription, source.active_subscription);
  `;

  const options = {
    query: query,
    params: { rows },
  };

  try {
    const [job] = await bigquery.createQueryJob(options); 
    await job.promise();
    console.log('Upserted rows into BigQuery successfully.');
  } catch (error) {
    console.error('Error upserting rows into BigQuery:', error);
  }
}
